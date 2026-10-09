import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

// Load discouraged words mapping
const rootDir = path.resolve(process.cwd());
const wordsFilePath = path.join(rootDir, 'scripts', 'discouraged-words.json');
const discouragedWords: Record<string, string> = JSON.parse(
  fs.readFileSync(wordsFilePath, 'utf-8')
);

// Count syllables in an English word
function countSyllables(rawWord: string): number {
  const word = rawWord.toLowerCase().replace(/[^a-z]/g, '');
  if (!word) return 1;
  if (word.length <= 3) return 1;

  // Replace common endings
  const clean = word
    .replace(/(?:[^laeiouy]|ed|es|e)$/, '')
    .replace(/^y/, '');

  const matches = clean.match(/[aeiouy]{1,2}/g);
  return matches ? Math.max(1, matches.length) : 1;
}

// Compute Flesch-Kincaid grade level
function calculateGradeLevel(
  totalWords: number,
  totalSentences: number,
  totalSyllables: number
): number {
  if (totalWords === 0 || totalSentences === 0) return 0;
  const score =
    0.39 * (totalWords / totalSentences) +
    11.8 * (totalSyllables / totalWords) -
    15.59;
  return Math.max(0, Math.round(score * 10) / 10);
}

// Split text into sentences
function splitSentences(text: string): string[] {
  // Normalize whitespace
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) return [];

  // Protect common abbreviations (e.g., i.e., vs.) and numbers
  const protectedText = normalized
    .replace(/\be\.g\./gi, 'eg_abbr')
    .replace(/\bi\.e\./gi, 'ie_abbr')
    .replace(/\bvs\./gi, 'vs_abbr')
    .replace(/(\d+)\.(\d+)/g, '$1_dec_$2');

  const rawSentences = protectedText.split(/(?<=[.?!])\s+/);
  return rawSentences
    .map((s) =>
      s
        .replace(/eg_abbr/g, 'e.g.')
        .replace(/ie_abbr/g, 'i.e.')
        .replace(/vs_abbr/g, 'vs.')
        .replace(/(\d+)_dec_(\d+)/g, '$1.$2')
        .trim()
    )
    .filter((s) => s.length > 0 && /[a-zA-Z]/.test(s));
}

// Extract text recursively from JSX children (excluding attributes)
function getJsxChildrenText(children: ts.NodeArray<ts.JsxChild>): string {
  let text = '';
  function walk(n: ts.Node): void {
    if (ts.isJsxText(n)) {
      text += ' ' + n.text;
    } else if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) {
      text += ' ' + n.text;
    } else if (ts.isJsxElement(n)) {
      walk(n.children);
    } else if (ts.isJsxSelfClosingElement(n)) {
      // e.g. <MathEquation math="..." /> - no direct prose text
    } else {
      ts.forEachChild(n, walk);
    }
  }

  for (const child of children) {
    walk(child);
  }

  return text.replace(/\s+/g, ' ').trim();
}

// Extract user-facing string blocks from TS/TSX source file
function extractUserFacingBlocks(filePath: string): string[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const sourceFile = ts.createSourceFile(
    filePath,
    content,
    ts.ScriptTarget.Latest,
    true
  );

  const blocks: string[] = [];

  const blockTags = new Set([
    'p',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'li',
    'figcaption',
    'P',
    'Lead',
    'Heading',
    'Subheading',
    'OlItem',
    'span',
  ]);

  function visit(node: ts.Node): void {
    // 1. JSX Elements that represent prose blocks
    if (ts.isJsxElement(node)) {
      const tagName = node.openingElement.tagName.getText();
      if (blockTags.has(tagName)) {
        const text = getJsxChildrenText(node.children);
        if (text.length > 0 && /[a-zA-Z]/.test(text)) {
          blocks.push(text);
        }
        // Still visit attributes on the opening element
        visit(node.openingElement.attributes);
        return; // Don't re-visit children individually
      }
    }

    // 2. String literals in attributes, properties, arrays, or comments
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      const parent = node.parent;
      let isUserFacing = false;

      if (ts.isJsxAttribute(parent)) {
        const attrName = parent.name.getText();
        if (
          [
            'title',
            'label',
            'caption',
            'subtext',
            'description',
            'aria-label',
            'eyebrow',
            'placeholder',
            'content',
          ].includes(attrName)
        ) {
          isUserFacing = true;
        }
      } else if (ts.isPropertyAssignment(parent)) {
        const propName = parent.name.getText();
        if (
          [
            'title',
            'label',
            'caption',
            'subtext',
            'description',
            'definition',
            'term',
            'note',
            'notes',
          ].includes(propName)
        ) {
          isUserFacing = true;
        }
      } else if (ts.isArrayLiteralExpression(parent)) {
        const grandParent = parent.parent;
        if (
          (ts.isJsxAttribute(grandParent) &&
            grandParent.name.getText() === 'tryThis') ||
          (ts.isPropertyAssignment(grandParent) &&
            grandParent.name.getText() === 'tryThis')
        ) {
          isUserFacing = true;
        }
      }

      // Also extract comments in sample code constants
      if (
        ts.isVariableDeclaration(parent) &&
        parent.name.getText().includes('CODE')
      ) {
        const commentLines = node.text
          .split('\n')
          .filter((line) => line.trim().startsWith('#'))
          .map((line) => line.replace(/^#\s*/, '').trim());
        for (const line of commentLines) {
          if (line.length > 0 && /[a-zA-Z]/.test(line)) {
            blocks.push(line);
          }
        }
      }

      if (isUserFacing) {
        const text = node.text.trim();
        if (text.length > 0 && /[a-zA-Z]/.test(text)) {
          blocks.push(text);
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return blocks;
}

// Find all .ts and .tsx files in a directory recursively
function findSourceFiles(dir: string): string[] {
  const results: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== 'dist') {
        results.push(...findSourceFiles(fullPath));
      }
    } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts'))) {
      if (!entry.name.endsWith('.test.ts') && !entry.name.endsWith('.test.tsx')) {
        results.push(fullPath);
      }
    }
  }

  return results;
}

interface Issue {
  file: string;
  type: 'long-sentence' | 'discouraged-word';
  detail: string;
  suggestion?: string;
  location?: string;
}

interface SectionReport {
  name: string;
  wordCount: number;
  sentenceCount: number;
  syllableCount: number;
  gradeLevel: number;
  longSentencesCount: number;
  discouragedWordsCount: number;
}

function runCheck(): void {
  const srcDir = path.join(rootDir, 'src');
  const files = findSourceFiles(srcDir);

  const issues: Issue[] = [];
  const sectionReports: SectionReport[] = [];

  let grandTotalWords = 0;
  let grandTotalSentences = 0;
  let grandTotalSyllables = 0;

  for (const file of files) {
    const relPath = path.relative(rootDir, file).replace(/\\/g, '/');
    const blocks = extractUserFacingBlocks(file);
    if (blocks.length === 0) continue;

    const sentences: string[] = [];
    for (const block of blocks) {
      sentences.push(...splitSentences(block));
    }
    if (sentences.length === 0) continue;

    let fileWords = 0;
    let fileSyllables = 0;
    let fileLongSentences = 0;
    let fileDiscouragedWords = 0;

    for (const sentence of sentences) {
      // Split words
      const words = sentence
        .split(/\s+/)
        .map((w) => w.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, ''))
        .filter((w) => w.length > 0);

      const wordCount = words.length;
      fileWords += wordCount;

      for (const w of words) {
        fileSyllables += countSyllables(w);
      }

      // (a) Sentences over 25 words
      if (wordCount > 25) {
        fileLongSentences++;
        issues.push({
          file: relPath,
          type: 'long-sentence',
          detail: `Sentence has ${wordCount} words (>25): "${sentence.substring(0, 90)}..."`,
        });
      }

      // (b) Discouraged words check
      const lowerSentence = sentence.toLowerCase();
      // Check multi-word phrase "in order to"
      if (lowerSentence.includes('in order to')) {
        fileDiscouragedWords++;
        issues.push({
          file: relPath,
          type: 'discouraged-word',
          detail: 'Found "in order to"',
          suggestion: 'Replace with "to"',
        });
      }

      for (const word of words) {
        const lower = word.toLowerCase();
        if (discouragedWords[lower]) {
          fileDiscouragedWords++;
          issues.push({
            file: relPath,
            type: 'discouraged-word',
            detail: `Found discouraged word: "${word}"`,
            suggestion: `Suggested replacement: "${discouragedWords[lower]}"`,
          });
        }
      }
    }

    grandTotalWords += fileWords;
    grandTotalSentences += sentences.length;
    grandTotalSyllables += fileSyllables;

    const gradeLevel = calculateGradeLevel(
      fileWords,
      sentences.length,
      fileSyllables
    );

    sectionReports.push({
      name: relPath,
      wordCount: fileWords,
      sentenceCount: sentences.length,
      syllableCount: fileSyllables,
      gradeLevel,
      longSentencesCount: fileLongSentences,
      discouragedWordsCount: fileDiscouragedWords,
    });
  }

  const overallGrade = calculateGradeLevel(
    grandTotalWords,
    grandTotalSentences,
    grandTotalSyllables
  );

  console.log('\n=============================================================');
  console.log('               LANGUAGE & READABILITY AUDIT REPORT            ');
  console.log('=============================================================\n');

  console.log(`Scanned ${files.length} files across src/`);
  console.log(`Total words: ${grandTotalWords} | Total sentences: ${grandTotalSentences}`);
  console.log(`Overall Readability: Grade ${overallGrade} (Target: Grade 8 or lower)\n`);

  console.log('--- PER-FILE BREAKDOWN ---');
  for (const report of sectionReports) {
    const status = report.gradeLevel <= 8 ? 'PASS (<=8)' : 'NEEDS EDIT (>8)';
    console.log(
      `- ${report.name.padEnd(45)} Grade: ${report.gradeLevel
        .toString()
        .padStart(4)} [${status}] | Long sentences: ${report.longSentencesCount} | Discouraged: ${report.discouragedWordsCount}`
    );
  }

  console.log('\n--- ISSUES IDENTIFIED ---');
  const longSentenceIssues = issues.filter((i) => i.type === 'long-sentence');
  const discouragedIssues = issues.filter((i) => i.type === 'discouraged-word');

  console.log(`\n[!] Sentences > 25 words: ${longSentenceIssues.length}`);
  for (const issue of longSentenceIssues.slice(0, 15)) {
    console.log(`  - [${issue.file}] ${issue.detail}`);
  }
  if (longSentenceIssues.length > 15) {
    console.log(`    ... and ${longSentenceIssues.length - 15} more`);
  }

  console.log(`\n[!] Discouraged words: ${discouragedIssues.length}`);
  for (const issue of discouragedIssues.slice(0, 20)) {
    console.log(
      `  - [${issue.file}] ${issue.detail} -> ${issue.suggestion}`
    );
  }
  if (discouragedIssues.length > 20) {
    console.log(`    ... and ${discouragedIssues.length - 20} more`);
  }

  console.log('\n=============================================================');
  if (longSentenceIssues.length === 0 && discouragedIssues.length === 0 && overallGrade <= 8) {
    console.log('>>> RESULT: CLEAN! All text meets readability & simplicity rules.');
  } else {
    console.log(`>>> RESULT: ${issues.length} item(s) to address across user-facing text.`);
  }
  console.log('=============================================================\n');

  // Exit with 0 (warning only, never blocks build)
  process.exit(0);
}

runCheck();

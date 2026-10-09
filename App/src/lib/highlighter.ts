import { createHighlighter, type Highlighter } from 'shiki';

let highlighterPromise: Promise<Highlighter> | null = null;

export function getHighlighterInstance(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ['vitesse-dark'],
      langs: ['python', 'typescript', 'bash', 'json'],
    });
  }
  return highlighterPromise;
}

export async function highlightCode(
  code: string,
  lang = 'python'
): Promise<string> {
  try {
    const highlighter = await getHighlighterInstance();
    return highlighter.codeToHtml(code, {
      lang,
      theme: 'vitesse-dark',
    });
  } catch {
    // Fallback if language is unrecognised
    return `<pre><code>${code}</code></pre>`;
  }
}

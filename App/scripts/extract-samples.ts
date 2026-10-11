import fs from 'node:fs';
import path from 'node:path';

const appJsPath = path.resolve(process.cwd(), '..', 'test', 'app.js');
const appJsContent = fs.readFileSync(appJsPath, 'utf-8');

// Match DATASET_SAMPLES = { ... };
const match = appJsContent.match(/const DATASET_SAMPLES = ({[\s\S]*?\n};)/);
if (!match || !match[1]) {
  throw new Error('Could not find DATASET_SAMPLES in test/app.js');
}

// Evaluate as pure JS object
const rawSamplesObj = new Function(`return ${match[1].replace(/;$/, '')}`)();

const samplesObj: Record<string, { label: number; pixels: number[] }> = {};
for (const [key, value] of Object.entries(rawSamplesObj)) {
  const item = value as { label: number; pixels: number[] };
  samplesObj[key] = {
    label: item.label,
    pixels: item.pixels.slice(0, 400),
  };
}

const outDir = path.resolve(process.cwd(), 'src', 'data');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const outPath = path.join(outDir, 'digitSamples.json');
fs.writeFileSync(outPath, JSON.stringify(samplesObj, null, 2), 'utf-8');
console.log(`Successfully extracted samples to ${outPath}`);
for (const [k, v] of Object.entries(samplesObj)) {
  console.log(`- ${k}: label=${v.label}, pixels=${v.pixels.length}`);
}

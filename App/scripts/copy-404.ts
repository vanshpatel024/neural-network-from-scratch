import fs from 'node:fs';
import path from 'node:path';

const distDir = path.resolve(process.cwd(), 'dist');
const indexPath = path.join(distDir, 'index.html');
const notFoundPath = path.join(distDir, '404.html');

if (fs.existsSync(indexPath)) {
  fs.copyFileSync(indexPath, notFoundPath);
  console.log('Successfully copied dist/index.html to dist/404.html for GitHub Pages SPA fallback');
} else {
  console.warn('dist/index.html was not found; skipped copying 404.html');
}

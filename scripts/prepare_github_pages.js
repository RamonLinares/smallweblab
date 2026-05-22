import fs from 'fs';
import path from 'path';

const siteRoot = process.cwd();
const outDir = path.join(siteRoot, 'out');
const basePath = '/smallweblab';
const textExtensions = new Set(['.html', '.css', '.js', '.json', '.xml', '.txt', '.md']);

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap(entry => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(fullPath);
    return [fullPath];
  });
}

function prefixRootUrls(source) {
  return source
    .replace(/(["'`])\/(?!\/|smallweblab(?:\/|$))/g, `$1${basePath}/`)
    .replace(/url\(\s*\/(?!\/|smallweblab(?:\/|$))/g, `url(${basePath}/`);
}

if (!fs.existsSync(outDir)) {
  throw new Error('Missing out/ directory. Run npm run build first.');
}

let changed = 0;
for (const filePath of walk(outDir)) {
  if (!textExtensions.has(path.extname(filePath))) continue;

  const source = fs.readFileSync(filePath, 'utf8');
  const next = prefixRootUrls(source);
  if (next === source) continue;

  fs.writeFileSync(filePath, next, 'utf8');
  changed += 1;
}

console.log(`Prepared GitHub Pages project-path URLs in ${changed} files.`);

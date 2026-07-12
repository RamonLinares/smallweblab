import fs from 'fs';
import path from 'path';

const siteRoot = process.cwd();
const outDir = path.join(siteRoot, 'out');

const entries = [
  { source: 'lab', target: 'lab' },
  { source: 'favicon.ico', target: 'favicon.ico' }
];

fs.mkdirSync(outDir, { recursive: true });

for (const entry of entries) {
  const source = path.join(siteRoot, entry.source);
  const target = path.join(outDir, entry.target);

  if (!fs.existsSync(source)) {
    continue;
  }

  fs.rmSync(target, { recursive: true, force: true });
  fs.cpSync(source, target, {
    recursive: true,
    filter: sourcePath => path.basename(sourcePath) !== '.DS_Store'
  });
  console.log(`Copied ${entry.source} to out/${entry.target}`);
}

const styleOverride = path.join(siteRoot, 'content', 'site-overrides.css');
const publishedStyle = path.join(outDir, 'style.css');

if (fs.existsSync(styleOverride) && fs.existsSync(publishedStyle)) {
  const css = fs.readFileSync(styleOverride, 'utf8').trim();
  fs.appendFileSync(publishedStyle, `\n\n/* Small Web Lab site overrides */\n${css}\n`);
  console.log('Appended content/site-overrides.css to out/style.css');
}

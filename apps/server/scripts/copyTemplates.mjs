import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.cwd());
const srcDir = path.join(root, 'src', 'templates');
const distDir = path.join(root, 'dist', 'templates');

if (!fs.existsSync(srcDir)) {
  process.exit(0);
}

fs.mkdirSync(distDir, { recursive: true });

for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
  if (!entry.isFile()) continue;
  const from = path.join(srcDir, entry.name);
  const to = path.join(distDir, entry.name);
  fs.copyFileSync(from, to);
}

console.log('✅  Copied report templates');

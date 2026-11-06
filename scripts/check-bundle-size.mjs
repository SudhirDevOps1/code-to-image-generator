import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { gzipSync } from 'node:zlib';

/**
 * Performance budget gate.
 *
 * Budgets are intentionally tight: the app must stay usable on a slow mobile
 * connection and must keep its offline precache small.
 */
const BUDGETS = {
  js: 260 * 1024, // gzip
  css: 60 * 1024, // gzip
  assets: 2.6 * 1024 * 1024, // fonts + icons, uncompressed
  total: 3.4 * 1024 * 1024,
};

const dist = path.join(process.cwd(), 'dist');

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(full)));
    else files.push(full);
  }
  return files;
}

const kb = (bytes) => `${(bytes / 1024).toFixed(1)} KB`;

const files = await walk(dist);
const buckets = { js: 0, css: 0, assets: 0, total: 0 };

for (const file of files) {
  const info = await stat(file);
  buckets.total += info.size;
  const ext = path.extname(file);

  if (ext === '.js' || ext === '.css') {
    const raw = await readFile(file);
    buckets[ext.slice(1)] += gzipSync(raw).length;
  } else {
    buckets.assets += info.size;
  }
}

const rows = [
  ['JavaScript (gzip)', buckets.js, BUDGETS.js],
  ['CSS (gzip)', buckets.css, BUDGETS.css],
  ['Assets (fonts/icons)', buckets.assets, BUDGETS.assets],
  ['Total build output', buckets.total, BUDGETS.total],
];

let failed = false;
console.log('\nBundle budget');
console.log('-'.repeat(52));
for (const [label, value, budget] of rows) {
  const ok = value <= budget;
  if (!ok) failed = true;
  console.log(
    `${ok ? 'PASS' : 'FAIL'}  ${label.padEnd(24)} ${kb(value).padStart(10)} / ${kb(budget)}`,
  );
}
console.log('-'.repeat(52));

if (failed) {
  console.error('Bundle budget exceeded. Reduce dependencies or raise the budget deliberately.');
  process.exit(1);
}

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const iconsDir = path.join(root, 'public', 'icons');
const publicDir = path.join(root, 'public');

const brandIcon = (size, { maskable = false } = {}) => {
  const radius = maskable ? 0 : Math.round(size * 0.22);
  const glyph = Math.round(size * (maskable ? 0.26 : 0.3));
  const y = maskable ? '53%' : '52%';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#6366f1"/>
      <stop offset="1" stop-color="#a855f7"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${radius}" fill="url(#g)"/>
  <text x="50%" y="${y}" text-anchor="middle" dominant-baseline="middle" font-family="DejaVu Sans Mono, Consolas, monospace" font-weight="700" font-size="${glyph}" fill="#ffffff">&lt;/&gt;</text>
</svg>`;
};

const ogImage = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#050505"/>
      <stop offset="1" stop-color="#0d0b1a"/>
    </linearGradient>
    <linearGradient id="brand" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#a5b4fc"/>
      <stop offset="1" stop-color="#e879f9"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="#6366f1" stop-opacity="0.55"/>
      <stop offset="1" stop-color="#6366f1" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="1200" height="630" fill="url(#bg)"/>
  <circle cx="1050" cy="80" r="360" fill="url(#glow)"/>
  <circle cx="120" cy="600" r="300" fill="url(#glow)" opacity="0.5"/>

  <rect x="72" y="72" width="44" height="44" rx="12" fill="#6366f1"/>
  <text x="94" y="102" text-anchor="middle" font-family="DejaVu Sans Mono, Consolas, monospace" font-weight="700" font-size="20" fill="#ffffff">&lt;/&gt;</text>
  <text x="132" y="103" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="22" font-weight="700" fill="#e4e4e7">CodeSnap</text>

  <text x="72" y="238" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="82" font-weight="800" fill="url(#brand)">Code to image,</text>
  <text x="72" y="330" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="82" font-weight="800" fill="#ffffff">beautifully.</text>
  <text x="76" y="386" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="24" fill="#a1a1aa">13 languages · 10 themes · 10 fonts · offline-first PWA</text>

  <g transform="translate(72 440)">
    <rect width="560" height="130" rx="16" fill="#1e1e2e" stroke="#ffffff" stroke-opacity="0.08"/>
    <circle cx="28" cy="26" r="6" fill="#ff5f56"/>
    <circle cx="50" cy="26" r="6" fill="#ffbd2e"/>
    <circle cx="72" cy="26" r="6" fill="#27c93f"/>
    <rect x="30" y="52" width="120" height="8" rx="4" fill="#ff79c6"/>
    <rect x="158" y="52" width="64" height="8" rx="4" fill="#8be9fd"/>
    <rect x="30" y="74" width="300" height="8" rx="4" fill="#50fa7b"/>
    <rect x="30" y="96" width="220" height="8" rx="4" fill="#f1fa8c" opacity="0.85"/>
  </g>

  <g font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="18" font-weight="600">
    <rect x="700" y="452" width="200" height="42" rx="21" fill="#ffffff" fill-opacity="0.07" stroke="#ffffff" stroke-opacity="0.12"/>
    <text x="800" y="479" text-anchor="middle" fill="#d4d4d8">100% client-side</text>
    <rect x="920" y="452" width="180" height="42" rx="21" fill="#6366f1" fill-opacity="0.18" stroke="#818cf8" stroke-opacity="0.4"/>
    <text x="1010" y="479" text-anchor="middle" fill="#c7d2fe">No uploads</text>
  </g>
</svg>`;

async function main() {
  await mkdir(iconsDir, { recursive: true });

  const png = (svg, size) =>
    sharp(Buffer.from(svg)).resize(size, size).png({ compressionLevel: 9 });

  await Promise.all([
    png(brandIcon(512), 192).toFile(path.join(iconsDir, 'icon-192.png')),
    png(brandIcon(512), 512).toFile(path.join(iconsDir, 'icon-512.png')),
    png(brandIcon(512, { maskable: true }), 512).toFile(
      path.join(iconsDir, 'icon-maskable-512.png'),
    ),
    png(brandIcon(512), 180).toFile(path.join(iconsDir, 'apple-touch-icon.png')),
    png(brandIcon(512), 32).toFile(path.join(publicDir, 'favicon-32.png')),
  ]);

  await sharp(Buffer.from(ogImage))
    .png({ compressionLevel: 9 })
    .toFile(path.join(publicDir, 'og-image.png'));

  const favicon = brandIcon(64);
  await writeFile(path.join(publicDir, 'favicon.svg'), `${favicon}\n`, 'utf8');

  console.log('[icons] generated PWA, Apple and Open Graph images');
}

main().catch((error) => {
  console.error('[icons] failed', error);
  process.exitCode = 1;
});

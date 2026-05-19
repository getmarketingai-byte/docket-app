/**
 * Generates PWA icon PNG files from SVG using sharp.
 * Run: node scripts/generate-icons.mjs
 */

import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync } from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ICONS_DIR = path.join(__dirname, '..', 'public', 'icons');

mkdirSync(ICONS_DIR, { recursive: true });

/**
 * A simple "D" lettermark on indigo background.
 * The maskable variant adds extra padding for safe-area compliance.
 */
function makeIconSvg(size, maskable = false) {
  const pad = maskable ? Math.round(size * 0.15) : 0;
  const inner = size - pad * 2;
  const fontSize = Math.round(inner * 0.55);
  const cx = size / 2;
  const cy = size / 2 + fontSize * 0.35; // optical vertical center

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.18)}" fill="#6366f1"/>
  <text
    x="${cx}" y="${cy}"
    font-family="system-ui, -apple-system, sans-serif"
    font-size="${fontSize}"
    font-weight="700"
    fill="white"
    text-anchor="middle"
  >D</text>
</svg>`;
}

const icons = [
  { name: 'icon-192.png', size: 192, maskable: false },
  { name: 'icon-512.png', size: 512, maskable: false },
  { name: 'icon-maskable-192.png', size: 192, maskable: true },
  { name: 'icon-maskable-512.png', size: 512, maskable: true },
];

for (const { name, size, maskable } of icons) {
  const svg = Buffer.from(makeIconSvg(size, maskable));
  const out = path.join(ICONS_DIR, name);
  await sharp(svg).png().toFile(out);
  console.log(`✓ ${name}`);
}

console.log('Icons generated in public/icons/');

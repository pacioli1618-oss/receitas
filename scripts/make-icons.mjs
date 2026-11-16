#!/usr/bin/env node
// Builds the app icons from the logo geometry (src/components/brand/Logo.tsx).
// Usage: node scripts/make-icons.mjs   (needs the sharp dev dependency)
// Writes app/icon.svg, app/apple-icon.png, public/icons/*.png and docs/brand/*.svg.

import {mkdir, writeFile} from 'node:fs/promises';
import sharp from 'sharp';

const c = {tile: '#B5432B', paper: '#FBF6EC', ink: '#2B211A', label: '#8C7B68'};

const full = {
  cover: {x: 28, y: 16, width: 52, height: 68, rx: 6},
  rings: [24, 38, 52, 66].map((y) => ({x: 21, y, width: 14, height: 6, rx: 3})),
  heart: 'M55 58 C43 50 40 42 45 37.5 C48.5 34.5 53 35.5 55 39.5 C57 35.5 61.5 34.5 65 37.5 C70 42 67 50 55 58 Z',
  label: {x: 44, y: 66, width: 22, height: 4, rx: 2},
};
const small = {
  cover: {x: 30, y: 18, width: 50, height: 64, rx: 6},
  rings: [27, 46, 65].map((y) => ({x: 21, y, width: 16, height: 8, rx: 4})),
  heart: 'M56 66 C40 55 36 44 43 38 C48 34 54 36 56 41 C58 36 64 34 69 38 C76 44 72 55 56 66 Z',
  label: null,
};

const rect = (r, fill) => `<rect x="${r.x}" y="${r.y}" width="${r.width}" height="${r.height}" rx="${r.rx}" fill="${fill}"/>`;

function glyph(mark) {
  return [
    rect(mark.cover, c.paper),
    ...mark.rings.map((ring) => rect(ring, c.ink)),
    `<path d="${mark.heart}" fill="${c.tile}"/>`,
    mark.label ? rect(mark.label, c.label) : '',
  ].join('');
}

/** Rounded tile (icon) or full-bleed square (maskable: the OS cuts its own shape, so the mark shrinks into the safe zone). */
function svg(mark, {isMaskable = false} = {}) {
  const tile = isMaskable ? `<rect width="100" height="100" fill="${c.tile}"/>` : `<rect width="100" height="100" rx="22" fill="${c.tile}"/>`;
  const content = isMaskable ? `<g transform="translate(15 15) scale(0.7)">${glyph(mark)}</g>` : glyph(mark);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${tile}${content}</svg>`;
}

const png = (source, size) => sharp(Buffer.from(source)).resize(size, size).png().toBuffer();

await mkdir('public/icons', {recursive: true});
await mkdir('docs/brand', {recursive: true});
await writeFile('src/app/icon.svg', svg(small));
await writeFile('docs/brand/receitas-app-icon.svg', svg(full));
await writeFile('docs/brand/receitas-favicon.svg', svg(small));
await writeFile('src/app/apple-icon.png', await png(svg(full, {isMaskable: true}), 180));
await writeFile('public/icons/icon-192.png', await png(svg(full), 192));
await writeFile('public/icons/icon-512.png', await png(svg(full), 512));
await writeFile('public/icons/icon-maskable-512.png', await png(svg(full, {isMaskable: true}), 512));
console.log('icons: ok');

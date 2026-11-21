import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

// Emerald background with a white circular-rotation mark (refresh/spin glyph).
const svg = (size, maskable) => {
  const pad = maskable ? size * 0.18 : 0; // extra safe margin for maskable
  const inner = size - pad * 2;
  const cx = size / 2;
  const cy = size / 2;
  // glyph: two curved arrows forming a circle (rotation = the "sus rotation" mark)
  const r = inner * 0.3;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="#059669"/>
  <g fill="none" stroke="white" stroke-width="${inner * 0.09}" stroke-linecap="round" stroke-linejoin="round" transform="translate(${cx} ${cy})">
    <path d="M ${-r} 0 A ${r} ${r} 0 0 1 ${r} 0" />
    <path d="M ${r} 0 A ${r} ${r} 0 0 1 ${-r} 0" opacity="0.55" />
    <path d="M ${r - r * 0.35} ${-r * 0.5} L ${r} 0 L ${r - r * 0.35} ${r * 0.5}" />
    <path d="M ${-r + r * 0.35} ${r * 0.5} L ${-r} 0 L ${-r + r * 0.35} ${-r * 0.5}" opacity="0.55" />
  </g>
</svg>`;
};

mkdirSync('public/icons', { recursive: true });

const targets = [
  { name: 'icon-192.png', size: 192, maskable: false },
  { name: 'icon-512.png', size: 512, maskable: false },
  { name: 'icon-maskable-512.png', size: 512, maskable: true },
  { name: 'apple-touch-icon.png', size: 180, maskable: false },
];

for (const t of targets) {
  await sharp(Buffer.from(svg(t.size, t.maskable)))
    .png()
    .toFile(`public/icons/${t.name}`);
  console.log('wrote', `public/icons/${t.name}`);
}

console.log('done');

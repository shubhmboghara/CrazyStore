const sharp = require('sharp');
const fs = require('fs');

const svg = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#9333ea" />
      <stop offset="100%" stop-color="#4f46e5" />
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#000000" flood-opacity="0.35" />
    </filter>
  </defs>
  <rect width="512" height="512" rx="115" fill="url(#bg)" />
  <rect x="4" y="4" width="504" height="504" rx="111" fill="none" stroke="#ffffff" stroke-opacity="0.15" stroke-width="6" />
  <path d="M205 150 C205 142 214 137 221 141 L355 241 C361 245 361 255 355 259 L221 359 C214 363 205 358 205 350 Z"
        fill="#ffffff" filter="url(#shadow)" />
</svg>`;

fs.writeFileSync('public/videohub-logo.svg', svg.trim());

sharp(Buffer.from(svg))
  .png()
  .toFile('public/videohub-logo.png')
  .then((info) => {
    console.log('Successfully generated public/videohub-logo.png:', info);
  })
  .catch((err) => {
    console.error('Error generating logo:', err);
    process.exit(1);
  });

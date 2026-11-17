// Copies Poppins (400/600/700/800) into public/fonts so renders never need the network,
// and writes a glyph-advance table for each Poppins weight so caption pagination is a pure,
// testable function (no DOM measuring).
import fs from 'node:fs';
import path from 'node:path';
import opentype from 'opentype.js';

const src = 'node_modules/@fontsource/poppins/files';
fs.mkdirSync('public/fonts', {recursive: true});
for (const w of [400, 600, 700, 800]) {
  for (const sub of ['latin', 'latin-ext']) {
    const f = `poppins-${sub}-${w}-normal.woff2`;
    fs.copyFileSync(path.join(src, f), path.join('public/fonts', f));
  }
}

const out = {};
for (const w of [400, 600, 700, 800]) {
  const widths = {};
  for (const sub of ['latin-ext', 'latin']) {
    const buf = fs.readFileSync(path.join(src, `poppins-${sub}-${w}-normal.woff`));
    const font = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
    for (let i = 0; i < font.glyphs.length; i++) {
      const g = font.glyphs.get(i);
      for (const u of g.unicodes || []) widths[String.fromCodePoint(u)] = +(g.advanceWidth / font.unitsPerEm).toFixed(4);
    }
  }
  out[w] = widths;
}
fs.writeFileSync('src/poppins-widths.json', JSON.stringify(out));
console.log('fonts copied; glyph widths written for', Object.keys(out).join(', '));

// The temp-voice manifest is generated (npm run voice) and git-ignored; start empty if missing.
if (!fs.existsSync('src/voice-manifest.json')) fs.writeFileSync('src/voice-manifest.json', '{}\n');

// Render specific frames as PNGs from one bundle.
//   node scripts/stills.mjs <outDir> <composition>@<frame> [...]
// A frame can be a number or seconds with an "s" suffix, e.g. 01-vocal@12.5s
import path from 'node:path';
import fs from 'node:fs';
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';

const [outDir, ...specs] = process.argv.slice(2);
const browserExecutable = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
const opts = fs.existsSync(browserExecutable) ? {browserExecutable} : {};
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
fs.mkdirSync(outDir, {recursive: true});
const comps = {};
for (const spec of specs) {
  const [id, f = '0'] = spec.split('@');
  comps[id] ??= await selectComposition({serveUrl, id, ...opts});
  const composition = comps[id];
  const frame = f.endsWith('s') ? Math.round(parseFloat(f) * composition.fps) : Number(f);
  const output = path.join(outDir, `${id}-f${String(frame).padStart(5, '0')}.png`);
  await renderStill({serveUrl, composition, frame, output, ...opts});
  console.log(output);
}

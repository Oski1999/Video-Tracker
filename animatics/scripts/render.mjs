// Batch render: one bundle, then each video's MP4 and contact sheet.
//   node scripts/render.mjs              all 10
//   node scripts/render.mjs 01-vocal     just these
// Same output as `npx remotion render <slug> out/<slug>.mp4`.
import path from 'node:path';
import fs from 'node:fs';
import {bundle} from '@remotion/bundler';
import {renderMedia, renderStill, selectComposition} from '@remotion/renderer';

const videos = JSON.parse(fs.readFileSync('handoff/videos.json', 'utf8')).videos;
const want = process.argv.slice(2);
const slugs = videos.map((v) => v.slug).filter((s) => !want.length || want.includes(s));
const browserExecutable = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
const opts = fs.existsSync(browserExecutable) ? {browserExecutable} : {};

const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
fs.mkdirSync('out', {recursive: true});
for (const slug of slugs) {
  const t0 = Date.now();
  const composition = await selectComposition({serveUrl, id: slug, ...opts});
  let last = -1;
  await renderMedia({
    serveUrl,
    composition,
    codec: 'h264',
    imageFormat: 'jpeg',
    jpegQuality: 90,
    outputLocation: `out/${slug}.mp4`,
    onProgress: ({progress}) => {
      const pct = Math.floor(progress * 10) * 10;
      if (pct !== last) process.stdout.write(`${slug} ${(last = pct)}%\n`);
    },
    ...opts,
  });
  const sheet = await selectComposition({serveUrl, id: `${slug}-contact`, ...opts});
  await renderStill({serveUrl, composition: sheet, frame: 0, output: `out/${slug}-contact-sheet.png`, ...opts});
  console.log(`${slug}: done in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
}

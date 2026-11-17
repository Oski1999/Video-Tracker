// Pre-delivery checks. Run: npx tsx scripts/check.ts [slug ...]
// Checks each shot list against the code that draws it, and each rendered MP4 in out/.
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {captionPages, wrap, CAPTION} from '../src/captions';
import {cutTimings, graphicOn, totalFrames, toFrame, FPS} from '../src/timeline';
import type {ShotList} from '../src/types';

const brand = JSON.parse(fs.readFileSync('handoff/brand/shield-classic.json', 'utf8'));
const videos = JSON.parse(fs.readFileSync('handoff/videos.json', 'utf8')).videos;
const want = process.argv.slice(2);
let failures = 0;
const fail = (msg: string) => {
  failures++;
  console.log(`  FAIL ${msg}`);
};

for (const v of videos) {
  if (want.length && !want.includes(v.slug)) continue;
  const list: ShotList = JSON.parse(fs.readFileSync(path.join('handoff', v.shot_list), 'utf8'));
  const cuts = cutTimings(list);
  const frames = totalFrames(list);
  console.log(`${v.slug}`);

  // 1. Length
  const compSec = frames / FPS;
  if (Math.abs(compSec - list.runtime_seconds) > 0.1) fail(`composition ${compSec.toFixed(3)} s vs runtime ${list.runtime_seconds}`);
  if (compSec >= 180) fail(`over 3:00 (${compSec.toFixed(2)} s)`);
  const mp4 = path.join('out', `${v.slug}.mp4`);
  if (fs.existsSync(mp4)) {
    const d = Number(
      execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-count_packets', '-show_entries', 'stream=nb_read_packets', '-of', 'csv=p=0', mp4])
        .toString()
        .trim()
        .replace(/,$/, ''),
    );
    const sec = d / FPS;
    if (!Number.isFinite(d)) fail(`could not read the frame count of ${mp4}`);
    console.log(`  mp4 ${d} frames = ${sec.toFixed(3)} s (runtime ${list.runtime_seconds} s)`);
    if (Math.abs(sec - list.runtime_seconds) > 0.1) fail(`MP4 length ${sec.toFixed(3)} s vs ${list.runtime_seconds}`);
    if (sec >= 180) fail('MP4 over 3:00');
  } else console.log('  (no MP4 rendered yet)');

  // Cuts tile the timeline with no gaps or overlaps
  cuts.forEach((c, i) => {
    if (c.dur <= 0) fail(`${c.shot.id} has no frames`);
    if (i && cuts[i - 1].from + cuts[i - 1].dur !== c.from) fail(`gap/overlap before ${c.shot.id}`);
  });
  if (cuts[cuts.length - 1].from + cuts[cuts.length - 1].dur !== frames) fail('cuts do not end at the last frame');

  // 2. Every line on screen, word for word, in order
  let lines = 0;
  let lastEnd = -1;
  for (const c of cuts) {
    for (const l of c.shot.lines) {
      lines++;
      const pages = captionPages(l);
      if (pages.map((p) => p.text).join(' ') !== l.text) fail(`${c.shot.id} caption text differs from script: "${l.text}"`);
      for (const p of pages) {
        if (wrap(p.text).length > CAPTION.maxLines) fail(`${c.shot.id} caption page over ${CAPTION.maxLines} lines`);
        const onFrames = toFrame(p.end) - toFrame(p.start);
        if (onFrames < 15) fail(`${c.shot.id} caption page shows only ${onFrames} frames: "${p.text}"`);
      }
      // Captions are looked up inside the current cut, so a line can never show past its cut.
      // Cut edges and line edges round to frames independently, so allow 1 frame of rounding.
      const gs = c.from + toFrame(l.start);
      const nominalEnd = c.from + toFrame(l.start + l.duration);
      if (nominalEnd > c.from + c.dur + 1) fail(`${c.shot.id} line runs past its cut by ${nominalEnd - c.from - c.dur} frames`);
      const ge = Math.min(nominalEnd, c.from + c.dur);
      if (gs < lastEnd) fail(`${c.shot.id} line overlaps the previous line`);
      lastEnd = ge;
    }
  }

  // 3. Graphics only inside in/out; checklists tick in order and carry over between cuts
  let prevChecked: Set<number> | null = null;
  let prevTitle = '';
  for (const c of cuts) {
    for (const g of c.shot.graphics) {
      if (g.in < 0 || g.out > c.shot.duration + 1e-6) fail(`${c.shot.id} ${g.kind} in/out outside the cut`);
      // sample every frame of the cut (and the dissolve tail) against in/out
      for (let f = 0; f < c.dur + 12; f++) {
        const t = f / FPS;
        const on = graphicOn(g, t);
        if (on !== (t >= g.in - 1e-6 && t < g.out - 1e-6)) fail(`${c.shot.id} ${g.kind} visibility wrong at local frame ${f}`);
      }
      if (g.kind === 'checklist') {
        const ticks = Object.entries(g.build_at ?? {})
          .map(([k, at]) => [Number(k), at] as const)
          .sort((a, b) => a[0] - b[0]);
        for (let i = 1; i < ticks.length; i++) if (ticks[i][1] < ticks[i - 1][1]) fail(`${c.shot.id} checklist ticks out of order`);
        for (const [k, at] of ticks) if (at < g.in || at >= g.out) fail(`${c.shot.id} item ${k} ticks outside the graphic`);
        const start = new Set(g.checked_at_start ?? []);
        if (prevChecked && prevTitle === g.title) {
          for (const k of prevChecked) if (!start.has(k)) fail(`${c.shot.id} item ${k} was ticked in the previous cut but starts unticked`);
        }
        const all = [...start, ...ticks.map((x) => x[0])].sort((a, b) => a - b);
        all.forEach((k, i) => {
          if (k !== i) fail(`${c.shot.id} "${g.title}" items not ticked in order (${all.join(',')})`);
        });
        prevChecked = new Set(all);
        prevTitle = g.title ?? '';
      }
    }
  }
  console.log(`  ${cuts.length} cuts, ${lines} lines checked`);
}

// 4. Colours, font and logo come from the brand file
const palette = new Set([...Object.values(brand.colors as Record<string, string>).map((c) => c.toUpperCase()), '#000', '#000000', '#FFF']);
for (const f of fs.readdirSync('src/graphics')) {
  const src = fs.readFileSync(path.join('src/graphics', f), 'utf8');
  for (const hex of src.match(/#[0-9A-Fa-f]{3,6}\b/g) ?? []) if (!palette.has(hex.toUpperCase())) fail(`src/graphics/${f} uses off-brand colour ${hex}`);
}
const brandTs = fs.readFileSync('src/brand.ts', 'utf8');
if (!brandTs.includes('brandJson.font.family')) fail('font family not taken from brand file');
for (const w of [400, 600, 700, 800]) if (!fs.existsSync(`public/fonts/poppins-latin-${w}-normal.woff2`)) fail(`Poppins ${w} missing (run npm run fonts)`);
if (!fs.existsSync(`public/${brand.logo.file}`)) fail('logo missing');
console.log(failures ? `\n${failures} check(s) failed` : '\nAll checks passed');
process.exit(failures ? 1 : 0);

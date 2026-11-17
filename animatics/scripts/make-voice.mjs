// Optional temp voice: one espeak-ng clip per line, a different voice per speaker.
// Clips are placed at each line's start and never stretch a cut: if a clip would run
// past its line's duration it is regenerated faster, and playback is trimmed to the line.
//   node scripts/make-voice.mjs [slug ...]      (default: all 10)
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

const VOICES = {P1: 'en-us+m3', P2: 'en-us+f2', EXTRA: 'en-us+m7'};
const BASE_WPM = 150;

const has = (cmd) => {
  try {
    execFileSync('which', [cmd], {stdio: 'ignore'});
    return true;
  } catch {
    return false;
  }
};
if (!has('espeak-ng')) {
  console.log('espeak-ng not found: skipping temp voice (videos stay silent).');
  process.exit(0);
}

const dur = (f) =>
  Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString().trim());

const videos = JSON.parse(fs.readFileSync('handoff/videos.json', 'utf8')).videos;
const want = process.argv.slice(2);
const manifestPath = 'src/voice-manifest.json';
const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : {};

for (const v of videos) {
  if (want.length && !want.includes(v.slug)) continue;
  const list = JSON.parse(fs.readFileSync(path.join('handoff', v.shot_list), 'utf8'));
  const dir = path.join('public', 'voice', v.slug);
  fs.mkdirSync(dir, {recursive: true});
  const clips = [];
  for (const shot of list.shots) {
    shot.lines.forEach((line, i) => {
      const file = path.join(dir, `${shot.id}-${i}.wav`);
      const voice = VOICES[line.speaker] ?? VOICES.P1;
      let wpm = BASE_WPM;
      for (let attempt = 0; attempt < 4; attempt++) {
        execFileSync('espeak-ng', ['-v', voice, '-s', String(wpm), '-w', file, line.text]);
        const d = dur(file);
        if (d <= line.duration - 0.05) break;
        wpm = Math.ceil((wpm * d) / (line.duration - 0.15));
      }
      clips.push({cut: shot.id, line: i, file: path.relative('public', file), wpm});
    });
  }
  manifest[v.slug] = clips;
  console.log(`${v.slug}: ${clips.length} clips (max ${Math.max(...clips.map((c) => c.wpm))} wpm)`);
}
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 1));

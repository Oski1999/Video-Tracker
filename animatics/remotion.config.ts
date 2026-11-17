import {Config} from '@remotion/cli/config';
import fs from 'node:fs';

Config.setEntryPoint('src/index.ts');
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(90);
Config.setCodec('h264');
Config.setOverwriteOutput(true);

// Use a locally installed headless Chromium when present (no browser download needed).
const local = process.env.REMOTION_BROWSER ?? '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
if (fs.existsSync(local)) Config.setBrowserExecutable(local);

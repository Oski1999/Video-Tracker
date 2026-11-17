// Caption paging. A line's exact text is split into pages of at most two lines
// (brand: "max 2 lines"), never rewritten or shortened. Pages joined by a space
// give back the original text exactly; scripts/check.mjs asserts that.
import {textWidth} from './measure';
import type {Line} from './types';

export const CAPTION = {
  size: 44,
  weight: 600 as const,
  lineHeight: 1.3,
  maxTextWidth: 1300,
  maxLines: 2,
};

export function wrap(text: string, maxWidth = CAPTION.maxTextWidth, size = CAPTION.size): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const cand = cur ? `${cur} ${w}` : w;
    if (cur && textWidth(cand, size, CAPTION.weight) > maxWidth) {
      lines.push(cur);
      cur = w;
    } else cur = cand;
  }
  if (cur) lines.push(cur);
  return lines;
}

const fits = (t: string) => wrap(t).length <= CAPTION.maxLines;

export function paginate(text: string): string[] {
  // Sentence pieces first, so pages break at full stops when they can.
  const sentences = text.split(/(?<=[.!?…]["”’']?) (?=\S)/);
  const pages: string[] = [];
  let cur = '';
  for (const s of sentences) {
    const cand = cur ? `${cur} ${s}` : s;
    if (fits(cand)) {
      cur = cand;
      continue;
    }
    if (cur) pages.push(cur);
    if (fits(s)) {
      cur = s;
      continue;
    }
    // One sentence longer than two lines: split it word by word.
    const lines = wrap(s);
    for (let i = 0; i < lines.length; i += CAPTION.maxLines) {
      const chunk = lines.slice(i, i + CAPTION.maxLines).join(' ');
      if (i + CAPTION.maxLines >= lines.length) cur = chunk;
      else pages.push(chunk);
    }
  }
  if (cur) pages.push(cur);
  return pages;
}

export type CaptionPage = {text: string; start: number; end: number};

/** Pages share the line's on-screen time in proportion to their word counts. */
export function captionPages(line: Line): CaptionPage[] {
  const pages = paginate(line.text);
  const counts = pages.map((p) => p.split(' ').length);
  const total = counts.reduce((a, b) => a + b, 0);
  let acc = 0;
  return pages.map((text, i) => {
    const start = line.start + (line.duration * acc) / total;
    acc += counts[i];
    const end = line.start + (line.duration * acc) / total;
    return {text, start, end};
  });
}

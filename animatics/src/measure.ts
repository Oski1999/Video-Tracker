// Text measuring from Poppins' real glyph advances (see scripts/setup-fonts.mjs).
import widths from './poppins-widths.json';

type Weight = 400 | 600 | 700 | 800;
const table = widths as unknown as Record<string, Record<string, number>>;

export function textWidth(text: string, size: number, weight: Weight = 600, letterSpacingPx = 0): number {
  const t = table[String(weight)];
  let w = 0;
  for (const ch of text) w += (t[ch] ?? 0.62) * size + letterSpacingPx;
  return w;
}

/** Largest size <= max at which text fits in maxWidth. */
export function fitSize(text: string, maxSize: number, maxWidth: number, weight: Weight, letterSpacingEm = 0): number {
  const at1 = textWidth(text, 1, weight, letterSpacingEm);
  return Math.min(maxSize, Math.floor(maxWidth / at1));
}

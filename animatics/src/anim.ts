import {interpolate} from 'remotion';
import {EASE} from './brand';

/** Eased 0→1 progress from frame `start` over `len` frames. */
export const prog = (frame: number, start: number, len: number, ease: (t: number) => number = EASE) =>
  interpolate(frame, [start, start + len], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: ease,
  });

export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

/** Deterministic pseudo-random in [0,1). */
export const rnd = (seed: number) => {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

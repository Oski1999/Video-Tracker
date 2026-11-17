// Pure timing helpers. No React, so scripts/check.mjs can import them through tsx.
import type {Graphic, Line, Shot, ShotList} from './types';

export const FPS = 30;
export const toFrame = (s: number) => Math.round(s * FPS);

export type CutTiming = {shot: Shot; index: number; from: number; dur: number};

/** Each cut runs from round(start*fps) to the next cut's start (the last one to start+duration). */
export function cutTimings(list: ShotList): CutTiming[] {
  return list.shots.map((shot, index) => {
    const from = toFrame(shot.start);
    const next = list.shots[index + 1];
    const end = next ? toFrame(next.start) : toFrame(shot.start + shot.duration);
    return {shot, index, from, dur: end - from};
  });
}

export function totalFrames(list: ShotList): number {
  const last = list.shots[list.shots.length - 1];
  return toFrame(last.start + last.duration);
}

export type Transition =
  | {kind: 'cut'}
  | {kind: 'band'; frames: number}
  | {kind: 'dissolve'; frames: number}
  | {kind: 'fade'; frames: number};

export function transitionOf(shot: Shot): Transition {
  const t = shot.transition_in.toLowerCase();
  const n = Number((t.match(/(\d+)\s*frames?/) || [])[1]);
  if (t.includes('band wipe')) return {kind: 'band', frames: n || 10};
  if (t.includes('dissolve')) return {kind: 'dissolve', frames: n || 12};
  if (t.includes('fade from black')) return {kind: 'fade', frames: n || 8};
  return {kind: 'cut'};
}

const EPS = 1e-6;
/** A graphic is on screen for in <= t < out (seconds from the cut's start). */
export const graphicOn = (g: Graphic, t: number) => t >= g.in - EPS && t < g.out - EPS;
export const lineOn = (l: Line, t: number) => t >= l.start - EPS && t < l.start + l.duration - EPS;

export function activeLine(shot: Shot, t: number): Line | undefined {
  return shot.lines.find((l) => lineOn(l, t));
}

export function timecode(frame: number): string {
  const ff = frame % FPS;
  const s = Math.floor(frame / FPS);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(Math.floor(s / 3600))}:${p(Math.floor(s / 60) % 60)}:${p(s % 60)}:${p(ff)}`;
}

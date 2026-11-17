import brandJson from '../handoff/brand/shield-classic.json';
import {Easing} from 'remotion';

export const brand = brandJson;
export const C = {
  black: brandJson.colors.black,
  red: brandJson.colors.red,
  white: brandJson.colors.white,
  lightGray: brandJson.colors.light_gray_text,
  pageGray: brandJson.colors.page_gray,
  setGray: brandJson.colors.placeholder_set_gray,
};
export const FONT = `${brandJson.font.family}, Arial, sans-serif`;
export const W = brandJson.canvas.width;
export const H = brandJson.canvas.height;
export const FPS = brandJson.canvas.fps;
export const SAFE = brandJson.canvas.safe_margin_px;
export const BAND_DEG = brandJson.signature_shape.angle_deg; // -9
export const M = {
  bandWipe: brandJson.motion.band_wipe_frames, // 10
  textIn: brandJson.motion.text_in_frames, // 12
  stagger: brandJson.motion.stagger_frames, // 6
};
// cubic-bezier(0.2, 0.8, 0.2, 1)
const parsed = brandJson.motion.default_ease.match(/[\d.]+/g)!.map(Number) as [number, number, number, number];
export const EASE = Easing.bezier(...parsed);

/** The kit reference is drawn at 400×225; the canvas is 1920×1080. */
export const KIT = W / 400; // 4.8

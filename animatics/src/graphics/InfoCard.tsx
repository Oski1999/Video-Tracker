import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, H, M, W} from '../brand';
import {prog} from '../anim';
import {shortName} from '../data';
import {fitSize, textWidth} from '../measure';
import type {GProps} from '../CutView';

const LEFT = 173;
const MAXW = W - LEFT - 96;

function layoutChips(items: string[]) {
  let fs = 58;
  for (;;) {
    const ls = fs * 0.17;
    const padX = fs;
    const widths = items.map((it) => textWidth(it, fs, 700, ls) + 2 * padX);
    const rows: number[][] = [[]];
    let x = 0;
    widths.forEach((w, i) => {
      const gap = rows[rows.length - 1].length ? 48 : 0;
      if (x + gap + w > MAXW && rows[rows.length - 1].length) {
        rows.push([i]);
        x = w;
      } else {
        rows[rows.length - 1].push(i);
        x += gap + w;
      }
    });
    if (rows.length <= 2 || fs < 30) return {fs, rows};
    fs = Math.floor(fs * 0.9);
  }
}

// "Black band wipes down at -9° (10 frames), title slides up 40 px with ease-out (12 frames),
//  subtitle fades in 6 frames later"
export const InfoCard: React.FC<GProps> = ({g, gf, list}) => {
  const items = (g.subtitle ?? '').split(' · ');
  // Newest item ("NEW") is the red chip; otherwise the last (key) item.
  const newIdx = items.findIndex((i) => /\bNEW\b/.test(i));
  const red = newIdx >= 0 ? newIdx : items.length - 1;
  const {fs, rows} = layoutChips(items);
  const titleSize = fitSize(g.title ?? '', 163, MAXW, 800, 0.02);

  const span = W * Math.sin(Math.PI / 20) + H * Math.cos(Math.PI / 20);
  const band = prog(gf, 0, M.bandWipe);
  const bandY = -(1 - band) * (2600 / 2 + span / 2);
  const title = prog(gf, 8, M.textIn);
  const sub = prog(gf, 8 + M.stagger, M.textIn);

  return (
    <AbsoluteFill style={{background: C.red, overflow: 'hidden'}}>
      <div
        style={{
          position: 'absolute',
          left: W / 2,
          top: H / 2,
          width: 3400,
          height: 2600,
          background: C.black,
          transform: `translate(-50%, -50%) rotate(-9deg) translateY(${bandY}px)`,
        }}
      />
      <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: 32, background: C.red}} />
      <div
        style={{
          position: 'absolute',
          left: LEFT,
          top: 144,
          fontSize: 48,
          fontWeight: 600,
          letterSpacing: '0.35em',
          color: C.red,
          opacity: title,
        }}
      >
        {shortName(list)}
      </div>
      <div
        style={{
          position: 'absolute',
          left: 163,
          top: 230 + (163 - titleSize) / 2,
          fontSize: titleSize,
          fontWeight: 800,
          lineHeight: 1.2,
          letterSpacing: '0.02em',
          color: C.white,
          whiteSpace: 'nowrap',
          opacity: title,
          transform: `translateY(${(1 - title) * 40}px)`,
        }}
      >
        {g.title}
      </div>
      <div style={{position: 'absolute', left: LEFT, top: 538, display: 'flex', flexDirection: 'column', gap: 29, opacity: sub}}>
        {rows.map((row, r) => (
          <div key={r} style={{display: 'flex', gap: 48}}>
            {row.map((i) => (
              <div
                key={i}
                style={{
                  background: i === red ? C.red : C.white,
                  color: i === red ? C.white : C.black,
                  fontSize: fs,
                  fontWeight: 700,
                  letterSpacing: '0.17em',
                  lineHeight: 1.25,
                  padding: `${fs * 0.62}px ${fs}px`,
                  borderRadius: 14,
                  whiteSpace: 'nowrap',
                }}
              >
                {items[i]}
              </div>
            ))}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

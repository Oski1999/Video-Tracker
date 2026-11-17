import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, M} from '../brand';
import {lerp, prog} from '../anim';
import {GROUP} from '../data';
import {fitSize, textWidth} from '../measure';
import type {GProps} from '../CutView';
import {Band, Logo} from './common';

const SUB = {size: 53, ls: 0.23, left: 154, width: 1382};

function wrapSub(text: string): string[] {
  const words = text.split(' ');
  const out: string[] = [];
  let cur = '';
  for (const w of words) {
    const cand = cur ? `${cur} ${w}` : w;
    if (cur && textWidth(cand, SUB.size, 600, SUB.size * SUB.ls) > SUB.width) {
      out.push(cur);
      cur = w;
    } else cur = cand;
  }
  if (cur) out.push(cur);
  return out;
}

// "Black band wipes down at -9° (10 frames), title punches in 1.15→1.0 scale (8 frames),
//  subtitle letter-spaces in, small logo fades in bottom right"
export const CategoryCard: React.FC<GProps> = ({g, gf}) => {
  const title = g.title ?? '';
  // Brand: title up to 230 px, shrink to fit 75% of width. Bottom of the title sits at y=720 as in the kit.
  const size = fitSize(title, 230, 1920 * 0.75, 800, 0.02);
  const band = prog(gf, 0, M.bandWipe);
  const punch = prog(gf, 6, 8);
  const sub = prog(gf, 12, M.textIn);
  const logo = prog(gf, 18, M.textIn);
  return (
    <AbsoluteFill style={{background: C.red, color: C.white}}>
      <Band color={C.black} top={-480} height={768} ty={-(1 - band) * 900} />
      <div style={{position: 'absolute', left: 154, top: 86, fontSize: 48, fontWeight: 600, letterSpacing: '0.35em', opacity: band}}>
        VIDEO {g.video_no} · {GROUP[g.video_no ?? ''] ?? ''}
      </div>
      <div
        style={{
          position: 'absolute',
          left: 144,
          top: 720 - size,
          fontSize: size,
          fontWeight: 800,
          lineHeight: 1,
          letterSpacing: '0.02em',
          whiteSpace: 'nowrap',
          transformOrigin: '0% 60%',
          transform: `scale(${lerp(1.15, 1, punch)})`,
          opacity: Math.min(1, punch * 3),
        }}
      >
        {title}
      </div>
      <div style={{position: 'absolute', left: SUB.left, top: 778, opacity: sub}}>
        {wrapSub(g.subtitle ?? '').map((l, i) => (
          <div
            key={i}
            style={{
              fontSize: SUB.size,
              fontWeight: 600,
              lineHeight: 1.35,
              whiteSpace: 'nowrap',
              letterSpacing: `${lerp(0.6, SUB.ls, sub)}em`,
            }}
          >
            {l}
          </div>
        ))}
      </div>
      <Logo style={{right: 96, bottom: 77, width: 206, height: 226, opacity: logo}} />
    </AbsoluteFill>
  );
};

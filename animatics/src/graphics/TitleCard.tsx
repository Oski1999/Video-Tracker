import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, M} from '../brand';
import {prog} from '../anim';
import type {GProps} from '../CutView';
import {Band, Logo} from './common';

// "Red band sweeps up at -9° (10 frames), shield scales 0.9→1.0, text tracks in from right 30 px"
export const TitleCard: React.FC<GProps> = ({gf}) => {
  const band = prog(gf, 0, M.bandWipe);
  const shield = prog(gf, 2, M.textIn);
  const txt = (i: number) => {
    const p = prog(gf, 4 + i * M.stagger, M.textIn);
    return {opacity: p, transform: `translateX(${(1 - p) * 30}px)`};
  };
  return (
    <AbsoluteFill style={{background: C.black}}>
      <Band color={C.red} bottom={-384} height={701} ty={(1 - band) * 900} />
      <Logo
        style={{left: 158, top: 158, width: 480, height: 528, opacity: Math.min(1, shield * 2), transform: `scale(${0.9 + 0.1 * shield})`}}
      />
      <div style={{position: 'absolute', left: 768, top: 250, display: 'flex', flexDirection: 'column', gap: 24, color: C.white}}>
        <div style={{fontSize: 43, fontWeight: 600, letterSpacing: '0.35em', ...txt(0)}}>2027 FINE ARTS</div>
        <div style={{fontSize: 139, fontWeight: 800, lineHeight: 1.02, letterSpacing: '0.02em', ...txt(1)}}>
          EXPLAINER
          <br />
          SERIES
        </div>
        <div style={{fontSize: 46, fontWeight: 400, letterSpacing: '0.16em', color: C.lightGray, ...txt(2)}}>
          WHAT TO EXPECT · HOW TO WIN
        </div>
      </div>
    </AbsoluteFill>
  );
};

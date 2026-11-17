import React from 'react';
import {AbsoluteFill, interpolate} from 'remotion';
import {C, M} from '../brand';
import {prog} from '../anim';
import type {GProps} from '../CutView';
import {Band, Logo} from './common';

// "Red band drops in at -9 degrees (10 frames), shield fades up, QUESTIONS? then email then dates
//  stagger in 6 frames apart; hold, then fade to black over the last 15 frames"
export const EndCard: React.FC<GProps> = ({gf, left}) => {
  const band = prog(gf, 0, M.bandWipe);
  const up = (start: number) => {
    const p = prog(gf, start, M.textIn);
    return {opacity: p, transform: `translateY(${(1 - p) * 24}px)`};
  };
  const black = interpolate(left, [0, 15], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{background: C.black, color: C.white}}>
      <Band color={C.red} top={-547} height={701} ty={-(1 - band) * 900} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 221, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 30}}>
        <div style={{position: 'relative', width: 293, height: 322, ...up(6)}}>
          <Logo style={{left: 0, top: 0, width: 293, height: 322}} />
        </div>
        <div style={{fontSize: 96, fontWeight: 800, letterSpacing: '0.1em', lineHeight: 1.15, ...up(6 + M.stagger)}}>QUESTIONS?</div>
        <div style={{fontSize: 62, fontWeight: 600, lineHeight: 1.2, ...up(6 + 2 * M.stagger)}}>SoCalClassicFA@gmail.com</div>
        <div style={{fontSize: 43, letterSpacing: '0.2em', lineHeight: 1.3, color: C.lightGray, ...up(6 + 3 * M.stagger)}}>
          FEB 24–26, 2027 · PACIFIC BAPTIST SCHOOL
        </div>
      </div>
      <AbsoluteFill style={{background: '#000', opacity: black}} />
    </AbsoluteFill>
  );
};

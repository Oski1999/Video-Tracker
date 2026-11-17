import React from 'react';
import {C} from '../brand';
import {prog} from '../anim';
import type {GProps} from '../CutView';

/**
 * "Red strip wipes in from left, then black bar unrolls right (8 frames); reverse to exit".
 * P1's bar sits bottom left under P1, P2's bottom right under P2, both above the caption zone.
 */
export const NameBars: React.FC<GProps> = ({g, gf, left, exits}) => {
  const names = Array.isArray(g.text) ? g.text : [String(g.text ?? '')];
  return (
    <>
      {names.map((name, i) => {
        const d = i * 6;
        const strip = prog(gf, d, 6);
        const box = prog(gf, d + 4, 8);
        // exit: box rolls back first, then the strip
        const boxOut = exits ? prog(14 - left, 0, 8) : 0;
        const stripOut = exits ? prog(6 - left, 0, 6) : 0;
        const side = i === 0 ? {left: 96} : {right: 96};
        return (
          <div key={i} style={{position: 'absolute', bottom: 250, display: 'flex', ...side}}>
            <div style={{width: 44, background: C.red, clipPath: `inset(0 ${Math.min(1, 1 - strip + stripOut) * 100}% 0 0)`}} />
            <div
              style={{
                background: C.black,
                padding: '34px 72px 38px 58px',
                display: 'flex',
                flexDirection: 'column',
                gap: 5,
                clipPath: `inset(0 ${Math.min(1, 1 - box + boxOut) * 100}% 0 0)`,
              }}
            >
              <div style={{color: C.white, fontSize: 77, fontWeight: 700, letterSpacing: '0.06em', lineHeight: 1.1, whiteSpace: 'nowrap'}}>
                {name}
              </div>
              <div style={{color: C.lightGray, fontSize: 43, letterSpacing: '0.17em', whiteSpace: 'nowrap'}}>[GRADE] · [SCHOOL]</div>
            </div>
          </div>
        );
      })}
    </>
  );
};

import React from 'react';
import {C} from '../brand';
import {prog} from '../anim';
import type {GProps} from '../CutView';

// "Slides in from right 60 px with 6-frame ease-out, small 1.05 scale pop, slides out at the end"
export const RulePopup: React.FC<GProps> = ({g, gf, left, exits}) => {
  const inP = prog(gf, 0, 6);
  const pop = 1 + 0.05 * Math.sin(Math.PI * prog(gf, 3, 8, (x) => x));
  const outP = exits ? prog(6 - left, 0, 6) : 0;
  const x = (1 - inP) * 60 + outP * 60;
  return (
    <div
      style={{
        position: 'absolute',
        right: 82,
        top: 77,
        background: C.white,
        borderRadius: 4,
        padding: '38px 53px',
        display: 'flex',
        flexDirection: 'column',
        gap: 5,
        opacity: inP * (1 - outP),
        transform: `translateX(${x}px) scale(${pop})`,
        transformOrigin: '100% 0%',
        boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
      }}
    >
      <div style={{color: C.red, fontSize: 72, fontWeight: 800, lineHeight: 1.1, whiteSpace: 'nowrap'}}>{g.text as string}</div>
      {g.caption ? <div style={{color: C.black, fontSize: 43, fontWeight: 600}}>{g.caption}</div> : null}
    </div>
  );
};

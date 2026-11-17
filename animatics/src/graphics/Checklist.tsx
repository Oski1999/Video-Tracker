import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, M} from '../brand';
import {lerp, prog} from '../anim';
import {toFrame} from '../timeline';
import type {GProps} from '../CutView';
import {CheckBox} from './common';

type Row = {checked: boolean; p: number};

/** Tick state per item, keyed by item index: checked_at_start, or build_at seconds from cut start. */
function rows(g: GProps['g'], gf: number): Row[] {
  const start = new Set(g.checked_at_start ?? []);
  return (g.items ?? []).map((_, i) => {
    if (start.has(i)) return {checked: true, p: 1};
    const at = g.build_at?.[String(i)];
    if (at === undefined) return {checked: false, p: 0};
    const f = gf - (toFrame(at) - toFrame(g.in));
    return f >= 0 ? {checked: true, p: prog(f, 0, 8)} : {checked: false, p: 0};
  });
}

export const Checklist: React.FC<GProps> = (props) =>
  props.g.mode === 'side_panel' ? <SidePanel {...props} /> : <Full {...props} />;

// "Header bar slides in from left; unchecked items sit at 40% opacity; each item gets a red check
//  pop and goes to full opacity at its build_at time"
const Full: React.FC<GProps> = ({g, gf}) => {
  const head = prog(gf, 2, M.bandWipe);
  const state = rows(g, gf);
  return (
    <AbsoluteFill style={{background: C.white}}>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: 1920,
          height: 250,
          background: C.black,
          transform: `translateX(${-(1 - head) * 1920}px)`,
          display: 'flex',
          alignItems: 'center',
          paddingLeft: 134,
          boxSizing: 'border-box',
        }}
      >
        <div style={{color: C.white, fontSize: 77, fontWeight: 800, letterSpacing: '0.19em'}}>{g.title}</div>
      </div>
      <div style={{position: 'absolute', left: 134, top: 336, display: 'flex', flexDirection: 'column', gap: 43}}>
        {(g.items ?? []).map((item, i) => {
          const s = state[i];
          const appear = prog(gf, 6 + i * M.stagger, 8);
          const opacity = s.checked ? lerp(0.4, 1, s.p) : 0.4 * appear;
          return (
            <div key={i} style={{display: 'flex', alignItems: 'center', gap: 48, opacity}}>
              <CheckBox size={77} p={s.p} checked={s.checked} />
              <div style={{fontSize: 72, fontWeight: 700, color: C.black, lineHeight: 1.1}}>{item}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// "Compact panel on the right third of frame over the speaker shot; items already checked show
//  ticked; new items tick at build_at". Brand: about 600 px wide, 90% opaque white.
const SidePanel: React.FC<GProps> = ({g, gf, left, exits}) => {
  const state = rows(g, gf);
  const out = exits ? prog(6 - left, 0, 6) : 0;
  return (
    <div
      style={{
        position: 'absolute',
        right: 96,
        top: 150,
        width: 600,
        background: 'rgba(255,255,255,0.9)',
        borderRadius: 6,
        overflow: 'hidden',
        boxShadow: '0 10px 40px rgba(0,0,0,0.25)',
        opacity: 1 - out,
        transform: `translateX(${out * 60}px)`,
      }}
    >
      <div style={{background: C.black, height: 96, display: 'flex', alignItems: 'center', paddingLeft: 36}}>
        <div style={{color: C.white, fontSize: 36, fontWeight: 800, letterSpacing: '0.19em'}}>{g.title}</div>
      </div>
      <div style={{padding: '30px 36px 34px', display: 'flex', flexDirection: 'column', gap: 22}}>
        {(g.items ?? []).map((item, i) => {
          const s = state[i];
          return (
            <div key={i} style={{display: 'flex', alignItems: 'center', gap: 20, opacity: s.checked ? lerp(0.4, 1, s.p) : 0.4}}>
              <CheckBox size={44} p={s.p} checked={s.checked} />
              <div style={{fontSize: 34, fontWeight: 700, color: C.black, lineHeight: 1.2}}>{item}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

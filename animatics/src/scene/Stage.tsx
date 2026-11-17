import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {C, H, W} from '../brand';
import {activeLine} from '../timeline';
import type {Shot} from '../types';
import {Figure, FigureDefs} from './Figure';
import {LOGO_FILE} from '../graphics/common';

/** Who a close-up is on: the first P1/P2 in on_camera, else in framing. */
export const closeUpSubject = (shot: Shot): 'P1' | 'P2' =>
  ((shot.on_camera.match(/P[12]/) || shot.framing.match(/P[12]/) || ['P1'])[0] as 'P1' | 'P2');

/**
 * Soft gray set with the shield logo faint on the back wall. P1 stands left, P2 right.
 * two_shot: both figures, medium. close_up: one figure, larger.
 */
export const Stage: React.FC<{shot: Shot; t: number; frame: number}> = ({shot, t}) => {
  const line = shot.voice === 'Voice-over' ? undefined : activeLine(shot, t);
  const talking = (who: string) => line?.speaker === who;
  const closeUp = shot.type === 'close_up';
  const hasPanel = shot.graphics.some((g) => g.kind === 'checklist' && g.mode === 'side_panel');

  let figures: React.ReactNode;
  let logo: React.CSSProperties;
  let railY: number;
  if (closeUp) {
    const who = closeUpSubject(shot);
    const x = hasPanel ? 700 : who === 'P1' ? 840 : 1080;
    figures = <Figure id="f" label={who} x={x} headY={430} s={2.2} look={who === 'P1' ? 1 : -1} speaking={talking(who)} t={t} />;
    logo = {left: x < W / 2 ? 1330 : 170, top: 120, width: 440, height: 486, opacity: 0.1, filter: 'blur(3px)'};
    railY = 940;
  } else {
    figures = (
      <>
        <Figure id="f" label="P1" x={620} headY={400} s={1.25} look={1} speaking={talking('P1')} t={t} />
        <Figure id="f" label="P2" x={1300} headY={400} s={1.25} look={-1} speaking={talking('P2')} t={t} />
      </>
    );
    logo = {left: W / 2 - 140, top: 150, width: 280, height: 309, opacity: 0.14};
    railY = 790;
  }

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{background: `linear-gradient(180deg, #8C8F94 0%, ${C.setGray} 55%, #6F7277 100%)`}} />
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <defs>
          <radialGradient id="spot" cx="50%" cy="38%" r="55%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect x={0} y={0} width={W} height={H} fill="url(#spot)" />
        {/* wall panels and chair rail, drawn in pencil */}
        {[240, 720, 1200, 1680].map((x) => (
          <line key={x} x1={x} y1={0} x2={x} y2={railY} stroke="#5E6166" strokeOpacity={0.35} strokeWidth={2} />
        ))}
        <rect x={0} y={railY} width={W} height={H - railY} fill="#000" opacity={0.08} />
        <line x1={0} y1={railY} x2={W} y2={railY} stroke="#4F5257" strokeOpacity={0.55} strokeWidth={3} />
        <line x1={0} y1={railY + 14} x2={W} y2={railY + 14} stroke="#4F5257" strokeOpacity={0.25} strokeWidth={2} />
      </svg>
      <Img src={staticFile(LOGO_FILE)} style={{position: 'absolute', objectFit: 'contain', ...logo}} />
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <FigureDefs id="f" />
        {figures}
      </svg>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.28) 100%)'}} />
    </AbsoluteFill>
  );
};

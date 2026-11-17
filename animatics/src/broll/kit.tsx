import React from 'react';
import {interpolate} from 'remotion';
import {EASE} from '../brand';

export const INK = '#3A3A3A';
export const PAPER = '#ECECE8';
export const SHADE = '#C9C9C6';

/** Pencil look: the shape drawn once firmly and once faintly offset, like a re-traced sketch line. */
export const Pencil: React.FC<{children: React.ReactNode; w?: number; fill?: string}> = ({children, w = 3, fill = 'none'}) => (
  <g stroke={INK} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" fill={fill}>
    <g strokeOpacity={0.85}>{children}</g>
    <g strokeOpacity={0.25} fillOpacity={0} transform="translate(2.5 1.8)">
      {children}
    </g>
  </g>
);

/** Camera transform about an origin: scale then pan. */
export const cam = (s: number, ox: number, oy: number, tx = 0, ty = 0) =>
  `translate(${tx} ${ty}) translate(${ox} ${oy}) scale(${s}) translate(${-ox} ${-oy})`;

export const ramp = (t: number, t0: number, t1: number, a: number, b: number, ease: (x: number) => number = EASE) =>
  interpolate(t, [t0, t1], [a, b], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});

export const linear = (x: number) => x;
export const inOut = (x: number) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);

/** Simple seated/standing sketch person (head + shoulders), grayscale. */
export const SketchPerson: React.FC<{x: number; y: number; s?: number; mouth?: number; look?: number; headRot?: number}> = ({
  x,
  y,
  s = 1,
  mouth = 0,
  look = 0,
  headRot = 0,
}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <Pencil fill="#BDBDBA">
      <path d="M -70 150 C -70 80 -40 62 0 62 C 40 62 70 80 70 150 Z" />
    </Pencil>
    <g transform={`rotate(${headRot} 0 40)`}>
      <Pencil fill="#D6D6D3">
        <circle cx={0} cy={0} r={42} />
      </Pencil>
      <circle cx={-14 + look * 8} cy={-4} r={4.5} fill={INK} />
      <circle cx={14 + look * 8} cy={-4} r={4.5} fill={INK} />
      {mouth > 0 ? (
        <ellipse cx={look * 6} cy={20} rx={9} ry={mouth} fill={INK} />
      ) : (
        <path d={`M ${-9 + look * 6} 18 Q ${look * 6} 24 ${9 + look * 6} 18`} stroke={INK} strokeWidth={3} fill="none" />
      )}
    </g>
  </g>
);

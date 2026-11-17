import React from 'react';

/**
 * Gray mannequin: sphere head + torso, shaded for a 3D-ish read, with a light pencil outline.
 * While `speaking`, the head bobs, the mouth moves and a soft glow pulses behind the head.
 */
export type FigureProps = {
  id: string; // unique per SVG for gradient ids
  label: string;
  x: number;
  headY: number;
  s: number;
  look: -1 | 1;
  speaking: boolean;
  t: number;
};

export const FigureDefs: React.FC<{id: string}> = ({id}) => (
  <defs>
    <radialGradient id={`${id}-head`} cx="38%" cy="32%" r="75%">
      <stop offset="0%" stopColor="#E4E4E4" />
      <stop offset="55%" stopColor="#B4B4B4" />
      <stop offset="100%" stopColor="#7E7E7E" />
    </radialGradient>
    <linearGradient id={`${id}-torso`} x1="0" y1="0" x2="1" y2="0.35">
      <stop offset="0%" stopColor="#D2D2D2" />
      <stop offset="55%" stopColor="#A9A9A9" />
      <stop offset="100%" stopColor="#7A7A7A" />
    </linearGradient>
    <linearGradient id={`${id}-neck`} x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor="#ADADAD" />
      <stop offset="100%" stopColor="#7C7C7C" />
    </linearGradient>
    <radialGradient id={`${id}-glow`} cx="50%" cy="50%" r="50%">
      <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
      <stop offset="45%" stopColor="#FFFFFF" stopOpacity="0.75" />
      <stop offset="75%" stopColor="#FFFFFF" stopOpacity="0.2" />
      <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
    </radialGradient>
    <radialGradient id={`${id}-shadow`} cx="50%" cy="50%" r="50%">
      <stop offset="0%" stopColor="#000" stopOpacity="0.28" />
      <stop offset="100%" stopColor="#000" stopOpacity="0" />
    </radialGradient>
  </defs>
);

const TORSO = 'M -178 185 C -180 130 -130 112 -62 104 L 62 104 C 130 112 180 130 178 185 L 168 760 L -168 760 Z';
const ARMS = ['M -150 215 C -158 330 -156 470 -150 760', 'M 150 215 C 158 330 156 470 150 760'];

const Outline: React.FC<{children: React.ReactNode}> = ({children}) => (
  <>
    <g stroke="#2E2E2E" strokeOpacity={0.75} strokeWidth={2.6} fill="none" vectorEffect="non-scaling-stroke">
      {children}
    </g>
    <g stroke="#2E2E2E" strokeOpacity={0.25} strokeWidth={1.6} fill="none" transform="translate(3 2)">
      {children}
    </g>
  </>
);

export const Figure: React.FC<FigureProps> = ({id, label, x, headY, s, look, speaking, t}) => {
  const bob = speaking ? -6 * Math.abs(Math.sin(t * 7)) : 0;
  const tilt = speaking ? 2.5 * Math.sin(t * 3.7) : 0;
  const glow = speaking ? 0.75 + 0.2 * Math.sin(t * 9) : 0;
  const mouthOpen = speaking ? 3 + 10 * Math.abs(Math.sin(t * 13) * Math.sin(t * 5.1 + 1)) : 0;
  const ex = look * 12;
  return (
    <g transform={`translate(${x} ${headY}) scale(${s})`}>
      <ellipse cx={30 * -look} cy={260} rx={260} ry={420} fill={`url(#${id}-shadow)`} />
      {glow > 0 ? <circle cx={0} cy={bob} r={150} fill={`url(#${id}-glow)`} opacity={glow} /> : null}
      {/* body */}
      <rect x={-34} y={50} width={68} height={70} fill={`url(#${id}-neck)`} />
      <path d={TORSO} fill={`url(#${id}-torso)`} />
      <Outline>
        <path d={TORSO} />
        <path d="M -34 60 L -34 106 M 34 60 L 34 106" />
        {ARMS.map((d) => (
          <path key={d} d={d} />
        ))}
      </Outline>
      {/* head */}
      <g transform={`translate(0 ${bob}) rotate(${tilt})`}>
        <ellipse cx={0} cy={0} rx={74} ry={84} fill={`url(#${id}-head)`} />
        <Outline>
          <ellipse cx={0} cy={0} rx={74} ry={84} />
        </Outline>
        {speaking ? <ellipse cx={0} cy={0} rx={80} ry={90} fill="none" stroke="#FFFFFF" strokeWidth={6 / s} opacity={glow * 0.8} /> : null}
        <ellipse cx={-24 + ex} cy={-6} rx={6} ry={8} fill="#2E2E2E" opacity={0.8} />
        <ellipse cx={24 + ex} cy={-6} rx={6} ry={8} fill="#2E2E2E" opacity={0.8} />
        {speaking ? (
          <ellipse cx={ex * 0.8} cy={36} rx={14} ry={mouthOpen} fill="#3A3A3A" opacity={0.85} />
        ) : (
          <path d={`M ${-14 + ex * 0.8} 33 Q ${ex * 0.8} 42 ${14 + ex * 0.8} 33`} stroke="#2E2E2E" strokeWidth={3} fill="none" strokeLinecap="round" />
        )}
      </g>
      <text x={look === 1 ? -118 : 92} y={-96} fontSize={42 / s} fontWeight={600} fill="#2E2E2E" opacity={0.6} fontFamily="Poppins">
        {label}
      </text>
    </g>
  );
};

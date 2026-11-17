import React from 'react';
import {Img, staticFile} from 'remotion';

/** One solid band rotated -9° that crosses the frame edge to edge (kit: left/right -30 → -144 px). */
export const Band: React.FC<{color: string; top?: number; bottom?: number; height: number; ty: number}> = ({
  color,
  top,
  bottom,
  height,
  ty,
}) => (
  <div
    style={{
      position: 'absolute',
      left: -144,
      width: 2208,
      top,
      bottom,
      height,
      background: color,
      transform: `translateY(${ty}px) rotate(-9deg)`,
    }}
  />
);

/**
 * The supplied socal-logo.png has "FEBRUARY 26–28, 2025" baked in under the shield, which
 * contradicts the 2027 dates. By default we use socal-logo-shield.png: the same file cropped
 * just above that date line (no recolor, no stretch). Set to 'socal-logo.png' to use the original.
 */
export const LOGO_FILE = 'socal-logo-shield.png';

export const Logo: React.FC<{style: React.CSSProperties}> = ({style}) => (
  <Img src={staticFile(LOGO_FILE)} style={{position: 'absolute', objectFit: 'contain', ...style}} />
);

/** Red check square; `p` = tick progress (0 = empty box, 1 = checked). */
export const CheckBox: React.FC<{size: number; p: number; checked: boolean}> = ({size, p, checked}) => {
  const pop = checked ? 1 + 0.3 * Math.sin(Math.PI * Math.min(1, p * 1.2)) : 1;
  return (
    <div
      style={{
        width: size,
        height: size,
        flex: 'none',
        borderRadius: size * 0.125,
        boxSizing: 'border-box',
        border: checked ? 'none' : `${Math.max(3, size * 0.07)}px solid #D7263D`,
        background: checked ? '#D7263D' : 'transparent',
        transform: `scale(${pop})`,
      }}
    >
      {checked ? (
        <svg width={size} height={size} viewBox="0 0 1 1">
          <path
            d="M0.24 0.53 L0.43 0.71 L0.77 0.31"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth={0.12}
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - Math.min(1, p * 1.4)}
          />
        </svg>
      ) : null}
    </div>
  );
};

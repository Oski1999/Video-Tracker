import React from 'react';
import {C, W} from './brand';
import {CAPTION, captionPages, wrap} from './captions';
import type {Line} from './types';

/** Bottom-centre caption, max 2 lines, Poppins 600 44px on a 70% black box, red speaker chip. */
export const CaptionBox: React.FC<{line: Line; t: number}> = ({line, t}) => {
  const pages = captionPages(line);
  const page = pages.find((p) => t >= p.start - 1e-6 && t < p.end - 1e-6) ?? pages[pages.length - 1];
  const lines = wrap(page.text);
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        width: W,
        bottom: 44,
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 22,
          background: 'rgba(0,0,0,0.7)',
          borderRadius: 6,
          padding: '16px 30px 16px 18px',
        }}
      >
        <div
          style={{
            background: C.red,
            color: C.white,
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: '0.08em',
            padding: '6px 10px',
            borderRadius: 3,
            alignSelf: 'center',
            whiteSpace: 'nowrap',
          }}
        >
          {line.speaker}
        </div>
        <div
          style={{
            color: C.white,
            fontSize: CAPTION.size,
            fontWeight: CAPTION.weight,
            lineHeight: CAPTION.lineHeight,
            textAlign: 'left',
          }}
        >
          {lines.map((l, i) => (
            <div key={i} style={{whiteSpace: 'nowrap'}}>
              {l}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

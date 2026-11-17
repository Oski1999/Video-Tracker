import React from 'react';
import {AbsoluteFill, Freeze} from 'remotion';
import {C, FONT} from './brand';
import {SHOT_LISTS} from './data';
import {cutTimings, timecode} from './timeline';
import {Animatic} from './Animatic';

export const SHEET = {cols: 5, tileW: 480, tileH: 270, gap: 24, label: 44, header: 110, pad: 40};

export const sheetSize = (slug: string) => {
  const n = SHOT_LISTS[slug].shots.length;
  const rows = Math.ceil(n / SHEET.cols);
  return {
    width: SHEET.pad * 2 + SHEET.cols * SHEET.tileW + (SHEET.cols - 1) * SHEET.gap,
    height: SHEET.header + SHEET.pad + rows * (SHEET.tileH + SHEET.label + SHEET.gap),
  };
};

/** One still from the middle of every cut, labelled with the cut id. */
export const ContactSheet: React.FC<{slug: string}> = ({slug}) => {
  const list = SHOT_LISTS[slug];
  const cuts = cutTimings(list);
  const scale = SHEET.tileW / list.width;
  return (
    <AbsoluteFill style={{background: C.pageGray, fontFamily: FONT, color: C.black}}>
      <div style={{position: 'absolute', left: SHEET.pad, top: 30}}>
        <div style={{fontSize: 18, fontWeight: 600, letterSpacing: '0.3em', color: C.red}}>CONTACT SHEET · MID-CUT STILLS</div>
        <div style={{fontSize: 36, fontWeight: 800}}>
          {list.slug} · {list.title} · {list.runtime} · {cuts.length} cuts
        </div>
      </div>
      {cuts.map((c, i) => {
        const col = i % SHEET.cols;
        const row = Math.floor(i / SHEET.cols);
        const mid = c.from + Math.floor(c.dur / 2);
        return (
          <div
            key={c.shot.id}
            style={{
              position: 'absolute',
              left: SHEET.pad + col * (SHEET.tileW + SHEET.gap),
              top: SHEET.header + row * (SHEET.tileH + SHEET.label + SHEET.gap),
              width: SHEET.tileW,
            }}
          >
            <div style={{width: SHEET.tileW, height: SHEET.tileH, overflow: 'hidden', position: 'relative', background: '#000'}}>
              <div style={{width: list.width, height: list.height, transform: `scale(${scale})`, transformOrigin: '0 0', position: 'absolute'}}>
                <Freeze frame={mid}>
                  <Animatic slug={slug} />
                </Freeze>
              </div>
            </div>
            <div style={{display: 'flex', gap: 10, alignItems: 'baseline', marginTop: 6}}>
              <div style={{fontSize: 20, fontWeight: 800}}>{c.shot.id}</div>
              <div style={{fontSize: 14, fontWeight: 600, color: '#555'}}>
                {c.shot.type} · SB {c.shot.storyboard_frame ?? '—'} · {timecode(mid)}
              </div>
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

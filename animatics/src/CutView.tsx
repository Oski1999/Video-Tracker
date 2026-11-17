import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {C} from './brand';
import {CutTiming, graphicOn, toFrame, transitionOf} from './timeline';
import type {Graphic, Shot, ShotList} from './types';
import {Stage} from './scene/Stage';
import {Broll} from './broll/Broll';
import {TitleCard} from './graphics/TitleCard';
import {CategoryCard} from './graphics/CategoryCard';
import {InfoCard} from './graphics/InfoCard';
import {Checklist} from './graphics/Checklist';
import {RulePopup} from './graphics/RulePopup';
import {NameBars} from './graphics/NameBars';
import {EndCard} from './graphics/EndCard';

export type GProps = {
  g: Graphic;
  shot: Shot;
  list: ShotList;
  /** frames since the graphic's `in` */
  gf: number;
  /** frames until the graphic's `out` (exit animations finish by then) */
  left: number;
  /** true when `out` falls before the cut ends, so the graphic animates off */
  exits: boolean;
  /** seconds from the cut's start */
  t: number;
};

const RENDER: Record<Graphic['kind'], React.FC<GProps>> = {
  title_card: TitleCard,
  category_card: CategoryCard,
  info_card: InfoCard,
  checklist: Checklist,
  rule_popup: RulePopup,
  name_bars: NameBars,
  end_card: EndCard,
};

/** "Locked off with a slow 3% push-in across the shot" → scale 1 → 1.03 over the cut. */
const cameraScale = (shot: Shot, frame: number, dur: number) => {
  const m = shot.camera.match(/(\d+(?:\.\d+)?)%\s*push-in/i);
  if (!m) return 1;
  return interpolate(frame, [0, dur], [1, 1 + Number(m[1]) / 100], {extrapolateRight: 'clamp'});
};

export const CutView: React.FC<{cut: CutTiming; list: ShotList}> = ({cut, list}) => {
  const frame = useCurrentFrame();
  const {shot, dur} = cut;
  const t = frame / list.fps;
  const tr = transitionOf(shot);
  const opacity = tr.kind === 'dissolve' ? interpolate(frame, [0, tr.frames], [0, 1], {extrapolateRight: 'clamp'}) : 1;

  let base: React.ReactNode = <AbsoluteFill style={{background: C.black}} />;
  if (shot.type === 'two_shot' || shot.type === 'close_up') {
    const s = cameraScale(shot, frame, dur);
    base = (
      <AbsoluteFill style={{transform: `scale(${s})`, transformOrigin: '50% 45%'}}>
        <Stage shot={shot} t={t} frame={frame} />
      </AbsoluteFill>
    );
  } else if (shot.type === 'cold_open' || shot.type === 'broll') {
    base = <Broll shot={shot} frame={frame} dur={dur} fps={list.fps} />;
  }

  return (
    <AbsoluteFill style={{opacity}}>
      {base}
      {shot.graphics.map((g, i) => {
        if (!graphicOn(g, t)) return null;
        const Comp = RENDER[g.kind];
        if (!Comp) return null;
        return (
          <Comp
            key={i}
            g={g}
            shot={shot}
            list={list}
            gf={frame - toFrame(g.in)}
            left={toFrame(g.out) - frame}
            exits={g.out < shot.duration - 0.01}
            t={t}
          />
        );
      })}
    </AbsoluteFill>
  );
};

import React from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {C, FONT, H, W} from './brand';
import {SHOT_LISTS} from './data';
import {CutTiming, activeLine, cutTimings, timecode, toFrame, transitionOf} from './timeline';
import {CutView} from './CutView';
import {CaptionBox} from './Captions';
import voiceManifest from './voice-manifest.json';

type VoiceClip = {cut: string; line: number; file: string};
const VOICE = voiceManifest as Record<string, VoiceClip[]>;

const cutAt = (cuts: CutTiming[], frame: number) =>
  cuts.find((c) => frame >= c.from && frame < c.from + c.dur) ?? cuts[cuts.length - 1];

export const Animatic: React.FC<{slug: string}> = ({slug}) => {
  const list = SHOT_LISTS[slug];
  const cuts = cutTimings(list);
  const frame = useCurrentFrame();
  const cur = cutAt(cuts, frame);
  const local = frame - cur.from;
  const t = local / list.fps;
  const line = activeLine(cur.shot, t);

  return (
    <AbsoluteFill style={{background: C.black, fontFamily: FONT, overflow: 'hidden'}}>
      {cuts.map((c, i) => {
        const next = cuts[i + 1];
        const nt = next ? transitionOf(next.shot) : {kind: 'cut' as const};
        // Under a cross-dissolve the outgoing shot keeps running (its graphics stay gated by in/out).
        const tail = nt.kind === 'dissolve' ? nt.frames : 0;
        return (
          <Sequence key={c.shot.id} from={c.from} durationInFrames={c.dur + tail} name={c.shot.id}>
            <CutView cut={c} list={list} />
          </Sequence>
        );
      })}

      <BandWipes cuts={cuts} frame={frame} />
      <FadeFromBlack cuts={cuts} frame={frame} />

      {line ? <CaptionBox line={line} t={t} /> : null}
      <Slate text={`${list.slug} · ${cur.shot.id} · frame ${cur.shot.storyboard_frame ?? '—'} · ${timecode(frame)}`} />

      {(VOICE[slug] ?? []).map((clip) => {
        const c = cuts.find((x) => x.shot.id === clip.cut)!;
        const l = c.shot.lines[clip.line];
        return (
          <Sequence
            key={clip.file}
            from={c.from + toFrame(l.start)}
            durationInFrames={Math.max(1, toFrame(l.duration))}
            layout="none"
          >
            <Audio src={staticFile(clip.file)} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

/**
 * Red band wipe at -9°. The band straddles the cut: it rises over the outgoing shot for the
 * first half of its frames, covers the whole frame across the cut point, then clears off the
 * top to reveal the incoming shot. Nothing is shown outside its own cut's time.
 */
const BAND_THICK = 1800; // perpendicular thickness; frame span across the band normal is ~1367 px
const BandWipes: React.FC<{cuts: CutTiming[]; frame: number}> = ({cuts, frame}) => {
  const span = W * Math.sin((9 * Math.PI) / 180) + H * Math.cos((9 * Math.PI) / 180);
  const travel = span / 2 + BAND_THICK / 2;
  for (const c of cuts) {
    const tr = transitionOf(c.shot);
    if (tr.kind !== 'band') continue;
    const half = Math.floor(tr.frames / 2);
    const k = frame - (c.from - half);
    if (k < 0 || k >= tr.frames) continue;
    const p = (k + 0.5) / tr.frames;
    const offset = travel * (1 - 2 * p); // + below frame → − above frame: sweeps up
    return (
      <AbsoluteFill style={{pointerEvents: 'none'}}>
        <div
          style={{
            position: 'absolute',
            left: W / 2,
            top: H / 2,
            width: 3200,
            height: BAND_THICK,
            background: C.red,
            transform: `translate(-50%, -50%) rotate(-9deg) translateY(${offset}px)`,
          }}
        />
      </AbsoluteFill>
    );
  }
  return null;
};

const FadeFromBlack: React.FC<{cuts: CutTiming[]; frame: number}> = ({cuts, frame}) => {
  for (const c of cuts) {
    const tr = transitionOf(c.shot);
    if (tr.kind !== 'fade') continue;
    if (frame < c.from || frame >= c.from + tr.frames) continue;
    const o = interpolate(frame - c.from, [0, tr.frames], [1, 0]);
    return <AbsoluteFill style={{background: '#000', opacity: o}} />;
  }
  return null;
};

const Slate: React.FC<{text: string}> = ({text}) => (
  <div
    style={{
      position: 'absolute',
      left: 18,
      top: 14,
      padding: '5px 12px',
      borderRadius: 4,
      background: 'rgba(0,0,0,0.35)',
      color: '#A6A6A6',
      fontSize: 20,
      fontWeight: 600,
      letterSpacing: '0.04em',
      fontVariantNumeric: 'tabular-nums',
      whiteSpace: 'nowrap',
    }}
  >
    {text}
  </div>
);

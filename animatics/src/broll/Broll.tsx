import React from 'react';
import {AbsoluteFill} from 'remotion';
import type {Shot} from '../types';
import {PAPER} from './kit';
import * as S from './scenes';

/** Pick the sketch for a b-roll / cold-open cut from what its framing and camera describe. */
const PICK: [RegExp, React.FC<S.SceneProps>][] = [
  [/choir/, S.Choir],
  [/measure/, S.Measures],
  [/keys/, S.PianoKeys],
  [/fan out|fanned/, S.PagesFan],
  [/framed piece/, S.FramedPiece],
  [/four tiles|four categories/, S.FourTiles],
  [/phone/, S.PhoneToCamera],
  [/usb/, S.UsbLaptop],
  [/you may begin/, S.JudgeFreeze],
  [/pulpit/, S.Pulpit],
  [/countdown/, S.Countdown],
  [/teacher/, S.TeacherKids],
  [/quiz lights|quizmaster/, S.QuizLights],
  [/memory master/, S.MemoryLine],
  [/stopwatch/, S.Stopwatch],
  [/loaf/, S.Loaf],
  [/plate/, S.CookiePlate],
];

export const sceneFor = (shot: Shot) => {
  const key = `${shot.framing} ${shot.camera}`.toLowerCase();
  return PICK.find(([re]) => re.test(key))?.[1];
};

export const Broll: React.FC<{shot: Shot; frame: number; dur: number; fps: number}> = ({shot, frame, dur, fps}) => {
  const t = frame / fps;
  const d = dur / fps;
  const Scene = sceneFor(shot);
  // "freeze frame … with a 4-frame white flash" and "white flash on the shutter click"
  const flashAt = /freeze frame/i.test(shot.camera) ? 2.4 : /white flash/i.test(shot.camera) ? 2.8 : null;
  const ff = flashAt === null ? -1 : frame - Math.round(flashAt * fps);
  const flash = ff >= 0 && ff < 4 ? [1, 0.75, 0.45, 0.15][ff] : 0;
  return (
    <AbsoluteFill style={{background: PAPER}}>
      <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
        {Scene ? <Scene t={t} d={d} /> : <S.Generic t={t} d={d} label={shot.framing} />}
      </svg>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.12) 100%)'}} />
      <div style={{position: 'absolute', left: 22, top: 56, fontSize: 20, fontWeight: 600, color: '#8A8A86', letterSpacing: '0.04em'}}>
        {shot.framing}
      </div>
      {flash > 0 ? <AbsoluteFill style={{background: '#FFFFFF', opacity: flash}} /> : null}
    </AbsoluteFill>
  );
};

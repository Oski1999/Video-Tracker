import './fonts';
import React from 'react';
import {Composition} from 'remotion';
import {SHOT_LISTS, VIDEOS} from './data';
import {totalFrames} from './timeline';
import {Animatic} from './Animatic';
import {ContactSheet, sheetSize} from './ContactSheet';

export const RemotionRoot: React.FC = () => (
  <>
    {VIDEOS.map((v) => {
      const list = SHOT_LISTS[v.slug];
      return (
        <React.Fragment key={v.slug}>
        <Composition
          id={v.slug}
          component={Animatic}
          durationInFrames={totalFrames(list)}
          fps={list.fps}
          width={list.width}
          height={list.height}
          defaultProps={{slug: v.slug}}
        />
        <Composition
          id={`${v.slug}-contact`}
          component={ContactSheet}
          durationInFrames={totalFrames(list)}
          fps={list.fps}
          {...sheetSize(v.slug)}
          defaultProps={{slug: v.slug}}
        />
        </React.Fragment>
      );
    })}
  </>
);

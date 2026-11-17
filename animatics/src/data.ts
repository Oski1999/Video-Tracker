// Shot lists are read from handoff/shots/*.json at build time (bundled by webpack).
import videos from '../handoff/videos.json';
import type {ShotList} from './types';
import s01 from '../handoff/shots/01-vocal.json';
import s02 from '../handoff/shots/02-piano.json';
import s03 from '../handoff/shots/03-art.json';
import s04 from '../handoff/shots/04-photography.json';
import s05 from '../handoff/shots/05-speech.json';
import s06 from '../handoff/shots/06-preaching.json';
import s07 from '../handoff/shots/07-teaching.json';
import s08 from '../handoff/shots/08-quizzing.json';
import s09 from '../handoff/shots/09-memory.json';
import s10 from '../handoff/shots/10-culinary.json';

const all = [s01, s02, s03, s04, s05, s06, s07, s08, s09, s10] as unknown as ShotList[];
export const SHOT_LISTS: Record<string, ShotList> = Object.fromEntries(all.map((s) => [s.slug, s]));
export const VIDEOS = videos.videos;

/** "VIDEO 0N · GROUP" label group, as in the kit reference. */
export const GROUP: Record<string, string> = {
  '01': 'MUSIC',
  '02': 'MUSIC',
  '03': 'ART',
  '04': 'ART',
  '05': 'SPEECH',
  '06': 'BIBLE',
  '07': 'BIBLE',
  '08': 'BIBLE',
  '09': 'BIBLE',
  '10': 'CULINARY',
};

/** Short category name for the info card's red label, from the video title. */
export const shortName = (list: ShotList) => list.title.split(': ').pop()!.toUpperCase();

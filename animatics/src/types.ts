export type Speaker = 'P1' | 'P2' | 'EXTRA' | string;

export type Line = {
  speaker: Speaker;
  text: string;
  start: number;
  duration: number;
};

export type Graphic = {
  kind:
    | 'title_card'
    | 'category_card'
    | 'info_card'
    | 'checklist'
    | 'rule_popup'
    | 'name_bars'
    | 'end_card';
  in: number;
  out: number;
  anim: string;
  // category_card / info_card / checklist
  title?: string;
  subtitle?: string;
  video_no?: string;
  // checklist
  items?: string[];
  mode?: 'full' | 'side_panel';
  checked_at_start?: number[];
  build_at?: Record<string, number>;
  // rule_popup (string) / name_bars (string[])
  text?: string | string[];
  caption?: string;
};

export type ShotType =
  | 'cold_open'
  | 'title_card'
  | 'category_card'
  | 'two_shot'
  | 'close_up'
  | 'broll'
  | 'graphic'
  | 'end_card';

export type Shot = {
  id: string;
  type: ShotType;
  start: number;
  duration: number;
  framing: string;
  on_camera: string;
  camera: string;
  voice?: string;
  lines: Line[];
  graphics: Graphic[];
  transition_in: string;
  storyboard_frame: number | null;
  storyboard_caption: string;
  section?: string;
  audio?: string;
};

export type ShotList = {
  video: number;
  slug: string;
  title: string;
  fps: number;
  width: number;
  height: number;
  runtime_seconds: number;
  runtime: string;
  shots: Shot[];
};

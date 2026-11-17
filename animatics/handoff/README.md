# SoCal Classic 2027 explainer animatics: handoff for Claude Code

Paste everything under "Prompt for Claude Code" into Claude Code, with this folder open as the project.

---

## Prompt for Claude Code

You're building **moving storyboards (animatics)** for 10 short explainer videos for the SoCal Classic 2027 Fine Arts tournament. They're test videos. The goal is to see each video's flow, timing and motion before anything is filmed. The visuals are placeholders. **The script lines, their timing, the cuts and the graphic motion have to be right.**

### What's in this folder

| Path | What it is |
|---|---|
| `videos.json` | Index of the 10 videos: slug, title, runtime, number of cuts |
| `shots/NN-slug.json` | **The source of truth.** Every cut in order, with start time, duration, framing, who's on camera, camera move, transition, the exact script lines with their timing, and every graphic with its in/out times and animation |
| `brand/shield-classic.json` | Look and motion tokens: colors, Poppins font, the -9° band, layouts for each graphic, easing and frame counts |
| `brand/socal-logo.png` | The shield logo (transparent PNG) |
| `brand/shield-classic-kit-reference.html` | Static reference of the finished graphics (title card, 10 category cards, end card, info card, checklist, name bar, rule pop-up). Open it in a browser and match it |
| `storyboard/storyboard-sketches.html` | Pencil-sketch storyboard frames. Each cut's `storyboard_frame` points to a frame number here |
| `scripts/NN-slug.md` | The final scripts, for reference. The shot lists already contain every line |

### What to build

1. A **Remotion** project (React + TypeScript), at 1920×1080 and 30 fps. Register one composition per video and read its `shots/*.json` at build time. Remotion is preferred because every frame is deterministic and it renders straight to MP4. If Remotion can't run, use HTML canvas frames piped to `ffmpeg`, with the same output.
2. One reusable component per `type` and per graphic `kind`:
   - `type`: `cold_open`, `title_card`, `category_card`, `two_shot`, `close_up`, `broll`, `graphic`, `end_card`
   - `graphics[].kind`: `title_card`, `category_card`, `info_card`, `checklist` (`mode: full` or `side_panel`), `rule_popup`, `name_bars`, `end_card`
3. **Placeholder people and sets.** Use simple grayscale 3D-ish sketch figures, like gray mannequins with a head sphere and a torso, drawn with a light pencil outline. Put them on a soft gray set with the shield logo faint on the back wall. P1 stands left and P2 stands right. In `close_up`, frame one figure larger.
   - Make the speaking figure's head bob or glow slightly while its line plays, so it's obvious who's talking.
   - For `broll`, draw a simple sketch of what `framing` describes, like a piano keyboard, a choir in rows or a framed picture. Then do the `camera` move it describes.
4. **Camera moves.** Do every move in `camera` with transforms, such as a slow 3% push-in, a pan, a pull-out or a freeze frame with a white flash. Do every transition in `transition_in`: hard cut, a 10-frame red band wipe at -9°, a 12-frame cross-dissolve into the end card, and an 8-frame fade from black at the very start.
5. **Graphics.** Build these exactly to `brand/shield-classic.json` and the kit reference. Animate each one as its `anim` text says, at its `in` and `out` times, in seconds from the cut's start.
   - Checklists tick each item at its `build_at` time, keyed by item index.
   - `checked_at_start` lists the items already ticked when the cut begins.
6. **Lines.** For each entry in `lines`, show a caption bottom center from `start` for `duration` seconds, with a small red `P1`/`P2` speaker chip. Use the exact text. Don't rewrite or shorten it.
   - Optional temp voice: if a local text-to-speech tool is available (for example `piper` or `espeak-ng`), generate one clip per line with different voices for P1 and P2. Place each clip at its line's start, and never stretch a cut to fit the audio.
   - Timing comes from the JSON, at 140 words per minute plus a 0.35 s gap.
7. **Burn-in slate.** Show this small, in gray, top left on every frame: `video slug · cut id · storyboard frame · timecode`. Use the shot list field names: `slug`, `id` and `storyboard_frame`. This lets the team give notes against a cut.
8. **Music.** Add none. Leave the audio silent except for the optional temp voice.

### Render

- Run `npx remotion render <composition> out/<slug>.mp4` for each video, then render all 10.
- Also make `out/<slug>-contact-sheet.png`: one still from the middle of every cut, in a grid labeled with the cut ids.

### Checks before you say it's done

- Each MP4's length matches `runtime_seconds` in its shot list, within 0.1 s, and every video is under 3:00.
- Every line in every shot list shows on screen, word for word, in order.
- No graphic shows outside its `in` and `out` times. Every checklist ticks in order.
- The colors, font and logo match `brand/shield-classic.json`.
- Start by rendering `01-vocal` and showing me a few stills from the cold open, a checklist cut and the end card. Render the other nine once that one looks right.

---

## How the timing was worked out

- Each spoken line gets its word count at 140 words per minute, plus a 0.35 s gap, with a 1.4 s minimum.
- Every video uses the same opening: a 4 s cold open, a 2 s title card, then a 2.5 s category card.
- The end card holds 1 s past its last line.
- Long storyboard frames are split into quick cuts:
  - The main shot, like a graphic or b-roll, holds about 8 s (12 s for a checklist).
  - The lines after that cut to the speaker's close-up, or to a two-shot for quick back-and-forth.
  - A checklist stays on as a side panel until its last item is said.

| Video | Runtime | Cuts |
|---|---|---|
| 01 Vocal | 2:38 | 26 |
| 02 Piano | 2:31 | 24 |
| 03 Art | 2:42 | 23 |
| 04 Photography | 2:23 | 23 |
| 05 Speech | 2:47 | 26 |
| 06 Preaching | 2:10 | 22 |
| 07 Teaching | 2:03 | 18 |
| 08 Quizzing | 2:41 | 26 |
| 09 Memory | 2:07 | 18 |
| 10 Culinary | 2:16 | 23 |

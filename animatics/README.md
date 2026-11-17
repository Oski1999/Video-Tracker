# SoCal Classic 2027 · explainer animatics

Moving storyboards for the 10 Fine Arts explainer videos. Remotion (React + TypeScript), 1920×1080, 30 fps.
The shot lists in `handoff/shots/*.json` drive everything: cut timing, lines, graphics and their in/out times.
Visuals are placeholders; script lines, timing, cuts and graphic motion are meant to be exact.

## Use it

```bash
npm install                 # also copies Poppins into public/fonts (no network needed at render time)
npm run voice               # optional temp voice with espeak-ng (P1, P2 and extras get different voices)
npm run check               # timing, captions, graphics and brand checks (also checks rendered MP4s in out/)

npx remotion render 01-vocal out/01-vocal.mp4          # one video
npx remotion still 01-vocal-contact out/01-vocal-contact-sheet.png   # its contact sheet
npm run render                                          # all 10 MP4s + contact sheets, one bundle
npm run render -- 03-art 04-photography                 # just some
npm run studio                                          # scrub in the browser
```

Compositions: one per video, named by slug (`01-vocal` … `10-culinary`), plus `<slug>-contact`, a grid of one
still from the middle of every cut, labelled with the cut id.

## Where things live

| Path | What |
|---|---|
| `handoff/` | The handoff package as received (shot lists, brand tokens, kit reference, scripts, storyboard) |
| `src/Animatic.tsx` | The timeline: cuts, red band wipes, fade from black, captions, burn-in slate, temp voice |
| `src/CutView.tsx` | One cut: set / b-roll layer, camera move, and its graphics gated by `in`/`out` |
| `src/graphics/` | One component per graphic `kind` (title, category, info, checklist full + side panel, rule pop-up, name bars, end card) |
| `src/scene/` | Gray set with the faint shield and the mannequin figures (P1 left, P2 right) |
| `src/broll/` | Pencil sketches for every b-roll / cold-open framing, each doing its `camera` move |
| `src/captions.ts` | Caption paging (max 2 lines, exact text) using Poppins' real glyph widths |
| `scripts/check.ts` | The pre-delivery checks |

## How the brief was interpreted

- **Cut timing.** Each cut starts at `round(start × 30)`. Length = last cut's `start + duration`, which is within 0.05 s of `runtime_seconds` for all 10.
- **Red band wipe (10 frames).** A solid red band at −9° sweeps up across the cut: it covers the outgoing shot for 5 frames, fully covers the frame on the cut, then clears off the top for 5 frames. So no shot or graphic shows outside its own time.
- **Cross-dissolve (12 frames).** The end card fades up over its first 12 frames while the outgoing two-shot keeps running underneath.
- **Fade from black (8 frames)** on the first frames of the cold open.
- **Camera moves.** "3% push-in" = linear scale 1.00→1.03 over the cut. B-roll moves are built per scene (pull-out, drift, pan, push-in, tile pops, rotation, freeze frame + 4-frame white flash, shutter flash).
- **Graphic animation.** Each follows its `anim` text with the brand motion tokens (ease `cubic-bezier(0.2,0.8,0.2,1)`, 10-frame band, 12-frame text in, 6-frame stagger). Exit animations only play when `out` falls before the end of the cut, and they finish by `out`.
- **Checklists.** Items in `checked_at_start` are ticked when the cut opens; others tick (red pop + check draw + 40%→100% opacity) at `build_at[index]`.
- **Sizes.** The kit reference is drawn at 400×225, so it is scaled ×4.8. Where `shield-classic.json` gives a pixel value, that wins (category title max 230 px shrink-to-fit 75% width, info-card bar 32 px, side panel 600 px, captions 44 px, name-bar strip 44 px).
- **Category card.** Title and subtitle come from the shot list (e.g. "MUSIC" / "VOCAL ENSEMBLES & CHOIRS"), which differs from the kit thumbnails ("VOCAL" / "ENSEMBLES · CHOIRS"). The `VIDEO 0N · GROUP` label uses the kit's groups.
- **Info card.** The red label is the video's short name; subtitle items split on " · " become chips, with the "NEW" item (else the last item) in red.
- **Name bars.** Two bars, P1's bottom left and P2's bottom right, raised above the caption box so they never collide. Second line is a `[GRADE] · [SCHOOL]` placeholder.
- **Captions.** A line longer than two lines is split into consecutive pages at sentence breaks where possible; the pages share the line's time by word count. The text is never edited.
- **Slate.** Top left on every frame: `slug · cut id · frame <storyboard_frame> · HH:MM:SS:FF` (frame "—" when the shot list has `null`).
- **Logo.** `public/socal-logo.png` (the original) has "FEBRUARY 26–28, 2025" printed under the shield. The animatics use `socal-logo-shield.png`, the same file cropped just above that line. Switch back with `LOGO_FILE` in `src/graphics/common.tsx`.
- **Temp voice.** espeak-ng, placed at each line's start. A clip that would run long is regenerated faster; playback is cut at the line's end. Cuts are never stretched.
- **Arrow glyph.** Poppins has no "→" (09 Memory info card), so that one character falls back to a system font.

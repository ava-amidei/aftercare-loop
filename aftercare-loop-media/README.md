# aftercare-loop-media

Demo-video pipeline for Aftercare Loop: narration audio (Gemini TTS), Playwright screen capture of the app in Scripted Demo Mode, HTML title/problem/closing cards, and ffmpeg assembly into a YouTube-ready MP4. All patient data is fictional.

## Output

| File | What it is |
|---|---|
| `video/out/aftercare-loop-demo.mp4` | 1920×1080, 30 fps, H.264 High (crf 18) + AAC 192 kbps 48 kHz stereo, faststart, about 2:00 (119.7 s). Captions burned in, loudness −16 LUFS. |
| `video/out/aftercare-loop-demo.srt` | English captions (a copy of `narration.srt`) for upload to YouTube. |
| `video/youtube-description.md` | Title, description (team, disclaimer) and chapters. |

## Layout

```
video/
  narration.md            script: one table row per shot (source of truth for the text)
  tts.mjs                 narration.md -> out/seg-NN.wav, out/segments.json, out/narration.srt (needs GEMINI_API_KEY)
  record.spec.ts          Playwright recorder: one browser context and one .webm per shot, plus card PNGs
  playwright.config.ts    config for the recorder (chromium, 1 worker, serial)
  cards/                  title.html, problem.html, closing.html, card.css, logo.svg (Montserrat + docs/DESIGN.md palette)
  assemble.mjs            trim/pad, mux, loudness-normalize, burn captions, encode
  youtube-description.md
  out/
    seg-NN.wav, segments.json, narration.srt   narration (do not regenerate casually; TTS has a daily quota)
    clips/shot-NN.webm|png, clips.json         recordings and screenshots, with per-shot lead-in for trimming
    captions/cap-NN.png                        rendered caption overlays
```

## Rebuild the video

Prerequisites: Node 20+, `npm install` in this folder (`@playwright/test`, `@google/genai`), Playwright chromium (`npx playwright install chromium`), ffmpeg/ffprobe on PATH, and the Montserrat font installed locally. Cards and captions use the system Montserrat. Chromium checks that it loaded and fails if it didn't.

1. **Start the app in Scripted Demo Mode** (deterministic, no API calls). From `aftercare-loop-app/`:
   ```sh
   AFTERCARE_FORCE_SCRIPTED=true npx next dev -p 3100
   ```
   Next 16 allows only one `next dev` per project directory. If another one is already running there, stop it or run from an APFS clone of the app (`cp -c -R`) on a free port.
2. **Record** (about 2 min). From `aftercare-loop-media/`:
   ```sh
   DEMO_BASE_URL=http://localhost:3100 npx playwright test -c video/playwright.config.ts
   ```
   This renders the cards for shots 1, 2 and 10 and records shots 3–9 for fictional patient `pt-a-pcos` (Maya Thompson): dashboard → Understand (paste, explain, scroll sections) → View source highlight, then a switch to `pt-c-endometriosis` (Priya Shah) whose paraphrased step lands under "Needs clarification" → back to Maya → Ask Kat "What should I ask my doctor?" → /check wrong answer → clarification → retry → /action-plan with the transportation/telehealth suggestion → /follow-up Copy summary → /evaluation (Safety filter).
   Each shot starts from a clean demo state carried forward via `storageState`, so always run the whole file. The tests run serially, and later shots depend on earlier ones. Each clip holds at least the segment duration + 0.6 s after its lead-in. A visible cursor and click ripple are injected, and the Next.js dev indicator is hidden.
3. **Assemble** (about 1.5 min):
   ```sh
   node video/assemble.mjs
   ```
   Assembly does the following:
   - Trims each clip's lead-in and cuts each segment to exactly `duration + gap`.
   - Loops cards as stills and pads each WAV with silence to the same frame-exact slot.
   - Joins segments with simple cuts.
   - Normalizes loudness in two passes (`loudnorm` I=−16, TP=−1.5, LRA=11).
   - Burns in captions from `narration.srt`. This ffmpeg build has no libass or drawtext, so each cue is rendered to a transparent PNG with Chromium in Montserrat and overlaid at the cue's times.
   - Encodes libx264 crf 18 and AAC 192k with `+faststart`, and adds a 0.5 s fade in and a 0.8 s fade out.

   Set `KEEP_WORK=1` to keep the intermediates in `out/.assemble/`.
4. **Verify**:
   ```sh
   ffprobe -v error -show_entries format=duration:stream=codec_name,width,height,r_frame_rate,sample_rate,channels -of default=nw=1 video/out/aftercare-loop-demo.mp4
   ffmpeg -ss 60 -i video/out/aftercare-loop-demo.mp4 -frames:v 1 /tmp/frame.png
   ```

## Changing the script

Edit `video/narration.md`, then re-run `node video/tts.mjs` (requires `GEMINI_API_KEY` from `aftercare-loop-app/.env.local`, never committed). This regenerates `segments.json` and `narration.srt`. Then re-run steps 2–3. If you change a patient's name, keep `narration.md`, `segments.json` and the fixture `displayName` consistent: the recorded audio says "Maya", which matches `pt-a-pcos` (Maya Thompson).

## Rules

- Synthetic data only. Problem-card figures come only from `docs/research/EVIDENCE-BRIEF.md` "Top 8", with citation footers. Do not add others.
- The app is recorded in Scripted Demo Mode and labels its responses that way. The video does not claim live AI output.
- Never log document text. The recorder reads the fictional sample summary in the browser only.
- Keys stay out of this folder. `tts.mjs` reads `GEMINI_API_KEY` from the environment.

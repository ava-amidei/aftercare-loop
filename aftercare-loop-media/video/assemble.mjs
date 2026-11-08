#!/usr/bin/env node
/**
 * Aftercare Loop demo-video assembler.
 *
 * Inputs (all under video/out/):
 *   segments.json, seg-NN.wav, narration.srt   (narration; never regenerated here)
 *   clips/clips.json, clips/shot-NN.webm|png   (from record.spec.ts)
 * Output:
 *   aftercare-loop-demo.mp4  1920x1080, 30 fps, H.264 (crf 18) + AAC 192k, faststart,
 *                            burned-in captions from narration.srt, loudness -16 LUFS
 *   aftercare-loop-demo.srt  copy of narration.srt for YouTube upload
 *
 * Per segment: the clip is trimmed (lead-in removed) to exactly duration + gap, cards are
 * looped stills, the WAV is padded with silence to the same length; segments are joined with
 * simple cuts. The local ffmpeg build has no libass/drawtext, so each caption is rendered to a
 * transparent PNG in Chromium (Montserrat) and burned in with `overlay`.
 *
 * Usage (from aftercare-loop-media/): node video/assemble.mjs
 */
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, "out");
const WORK = path.join(OUT, ".assemble");
const CAPS = path.join(OUT, "captions");
const FINAL = path.join(OUT, "aftercare-loop-demo.mp4");
const FPS = 30;
const W = 1920;
const H = 1080;

const run = (args, opts = {}) =>
  execFileSync("ffmpeg", ["-hide_banner", "-v", "error", "-y", ...args], { stdio: ["ignore", "pipe", "pipe"], ...opts });

function log(msg) {
  process.stdout.write(`[assemble] ${msg}\n`);
}

// ---------- inputs ----------
const seg = JSON.parse(fs.readFileSync(path.join(OUT, "segments.json"), "utf8"));
const GAP = seg.gap ?? 0.6;
const clips = JSON.parse(fs.readFileSync(path.join(OUT, "clips", "clips.json"), "utf8"));
const missing = [];
for (const s of seg.segments) {
  const wav = path.join(OUT, `seg-${String(s.n).padStart(2, "0")}.wav`);
  if (!fs.existsSync(wav)) missing.push(`audio seg-${s.n}`);
  const c = clips[String(s.n)];
  if (!c || !fs.existsSync(path.join(OUT, c.file))) missing.push(`clip ${s.n}`);
}
if (missing.length) {
  console.error(`[assemble] missing inputs: ${missing.join(", ")}`);
  process.exit(1);
}

function parseSrt(text) {
  const t = (s) => {
    const m = s.trim().match(/(\d+):(\d+):(\d+)[,.](\d+)/);
    return +m[1] * 3600 + +m[2] * 60 + +m[3] + +m[4] / 1000;
  };
  return text
    .replace(/\r/g, "")
    .trim()
    .split(/\n\s*\n/)
    .map((block) => {
      const lines = block.split("\n");
      const [a, b] = lines[1].split("-->");
      return { start: t(a), end: t(b), text: lines.slice(2).join(" ").trim() };
    });
}
const cues = parseSrt(fs.readFileSync(path.join(OUT, "narration.srt"), "utf8"));

fs.rmSync(WORK, { recursive: true, force: true });
fs.mkdirSync(WORK, { recursive: true });
fs.mkdirSync(CAPS, { recursive: true });

// ---------- timeline (frame-exact cumulative boundaries, so A/V never drift) ----------
let t = 0;
const timeline = seg.segments.map((s) => {
  const len = s.duration + GAP;
  const startF = Math.round(t * FPS);
  t += len;
  const endF = Math.round(t * FPS);
  return { ...s, len, frames: endF - startF, startF };
});
const total = t;
const totalFrames = Math.round(total * FPS);
log(`segments=${timeline.length} total=${total.toFixed(2)}s frames=${totalFrames}`);

// ---------- captions -> transparent PNGs (Montserrat via Chromium) ----------
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
for (let i = 0; i < cues.length; i++) {
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    html,body{margin:0;width:${W}px;height:${H}px;background:transparent;overflow:hidden}
    .wrap{position:absolute;left:0;right:0;bottom:36px;display:flex;justify-content:center}
    .cap{max-width:1680px;padding:14px 34px 16px;border-radius:24px;background:rgba(20,20,20,.80);
      color:#fff;font-family:"Montserrat",sans-serif;font-weight:600;font-size:34px;line-height:1.34;
      text-align:center;letter-spacing:.005em;-webkit-font-smoothing:antialiased}
  </style></head><body><div class="wrap"><div class="cap">${esc(cues[i].text)}</div></div></body></html>`;
  await page.setContent(html);
  await page.evaluate(() => document.fonts.ready);
  const fam = await page.evaluate(() => document.fonts.check('600 34px "Montserrat"'));
  if (!fam) throw new Error("Montserrat not available to Chromium for captions");
  await page.screenshot({ path: path.join(CAPS, `cap-${String(i + 1).padStart(2, "0")}.png`), omitBackground: true });
}
await browser.close();
log(`captions rendered: ${cues.length} (Montserrat)`);

// ---------- per-segment video (intermediate, near-lossless) ----------
const listFile = path.join(WORK, "list.txt");
const parts = [];
for (const s of timeline) {
  const c = clips[String(s.n)];
  const src = path.join(OUT, c.file);
  const dur = (s.frames / FPS).toFixed(4);
  const outPart = path.join(WORK, `v-${String(s.n).padStart(2, "0")}.mp4`);
  const vf = `scale=${W}:${H}:flags=lanczos,setsar=1,fps=${FPS},tpad=stop_mode=clone:stop_duration=2,trim=end_frame=${s.frames},setpts=PTS-STARTPTS,format=yuv420p`;
  const input =
    c.kind === "card"
      ? ["-loop", "1", "-framerate", String(FPS), "-t", String(+dur + 1), "-i", src]
      : ["-ss", String(c.leadIn), "-i", src];
  run([...input, "-an", "-vf", vf, "-frames:v", String(s.frames), "-c:v", "libx264", "-preset", "fast", "-crf", "10", "-r", String(FPS), outPart]);
  parts.push(outPart);
  log(`segment ${s.n}: ${c.kind} ${dur}s (${s.frames} frames)${c.kind === "clip" ? ` lead-in ${c.leadIn}s` : ""}`);
}
fs.writeFileSync(listFile, parts.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join("\n") + "\n");
const videoOnly = path.join(WORK, "video.mp4");
run(["-f", "concat", "-safe", "0", "-i", listFile, "-c", "copy", videoOnly]);

// ---------- audio: pad each WAV to its slot, concat, loudness-normalize (2-pass) ----------
const aIn = [];
let aFilter = "";
timeline.forEach((s, i) => {
  aIn.push("-i", path.join(OUT, `seg-${String(s.n).padStart(2, "0")}.wav`));
  const slot = (s.frames / FPS).toFixed(4);
  aFilter += `[${i}:a]aresample=48000,aformat=sample_fmts=fltp:channel_layouts=mono,apad=whole_dur=${slot},atrim=end=${slot},asetpts=PTS-STARTPTS[a${i}];`;
});
aFilter += timeline.map((_, i) => `[a${i}]`).join("") + `concat=n=${timeline.length}:v=0:a=1[aout]`;
const rawAudio = path.join(WORK, "narration-raw.wav");
run([...aIn, "-filter_complex", aFilter, "-map", "[aout]", "-c:a", "pcm_s16le", rawAudio]);

const LN = "I=-16:TP=-1.5:LRA=11";
// Pass 1: measure (loudnorm prints its JSON on stderr).
const p1 = spawnSync("ffmpeg", ["-hide_banner", "-nostats", "-i", rawAudio, "-af", `loudnorm=${LN}:print_format=json`, "-f", "null", "-"], {
  encoding: "utf8",
});
const jsonBlocks = (p1.stderr || "").match(/\{[\s\S]*?\}/g);
if (p1.status !== 0 || !jsonBlocks) throw new Error("loudnorm pass 1 failed");
const measured = JSON.parse(jsonBlocks[jsonBlocks.length - 1]);
log(`loudness pass1: I=${measured.input_i} LUFS TP=${measured.input_tp} LRA=${measured.input_lra}`);
const normAudio = path.join(WORK, "narration-norm.wav");
run([
  "-i",
  rawAudio,
  "-af",
  `loudnorm=${LN}:measured_I=${measured.input_i}:measured_TP=${measured.input_tp}:measured_LRA=${measured.input_lra}:measured_thresh=${measured.input_thresh}:offset=${measured.target_offset}:linear=true,aresample=48000,afade=t=out:st=${(totalFrames / FPS - 0.5).toFixed(3)}:d=0.5`,
  "-ac",
  "2",
  "-ar",
  "48000",
  "-c:a",
  "pcm_s16le",
  normAudio,
]);

// ---------- final: burn captions, fade in/out, encode ----------
const capIn = [];
let vf = `[0:v]fade=t=in:st=0:d=0.5,fade=t=out:st=${(totalFrames / FPS - 0.8).toFixed(3)}:d=0.8[b0];`;
cues.forEach((c, i) => {
  capIn.push("-loop", "1", "-framerate", String(FPS), "-i", path.join(CAPS, `cap-${String(i + 1).padStart(2, "0")}.png`));
  vf += `[b${i}][${i + 2}:v]overlay=0:0:shortest=0:eof_action=pass:enable='between(t,${c.start.toFixed(3)},${c.end.toFixed(3)})'[b${i + 1}];`;
});
vf += `[b${cues.length}]format=yuv420p[vout]`;
run([
  "-i",
  videoOnly,
  "-i",
  normAudio,
  ...capIn,
  "-filter_complex",
  vf,
  "-map",
  "[vout]",
  "-map",
  "1:a",
  "-frames:v",
  String(totalFrames),
  "-r",
  String(FPS),
  "-c:v",
  "libx264",
  "-preset",
  "slow",
  "-crf",
  "18",
  "-profile:v",
  "high",
  "-pix_fmt",
  "yuv420p",
  "-c:a",
  "aac",
  "-b:a",
  "192k",
  "-ar",
  "48000",
  "-movflags",
  "+faststart",
  "-shortest",
  FINAL,
]);
fs.copyFileSync(path.join(OUT, "narration.srt"), path.join(OUT, "aftercare-loop-demo.srt"));
if (!process.env.KEEP_WORK) fs.rmSync(WORK, { recursive: true, force: true });
log(`wrote ${path.relative(process.cwd(), FINAL)} and aftercare-loop-demo.srt`);

// Generate narration segments from video/narration.md using Gemini TTS (REST Interactions API).
// Usage: node video/tts.mjs [voice]   → video/out/seg-01.wav … + video/out/segments.json + video/out/narration.srt
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const key = process.env.GEMINI_API_KEY;
if (!key) { console.error("GEMINI_API_KEY not set (source aftercare-loop-app/.env.local)"); process.exit(2); }
const model = process.env.AFTERCARE_GEMINI_TTS_MODEL ?? "gemini-3.8-flash-tts";
const voice = process.argv[2] ?? process.env.AFTERCARE_TTS_VOICE ?? "Sulafat";
const style = process.env.AFTERCARE_TTS_STYLE ?? "warm, clear, unhurried, friendly";
const outDir = path.resolve("video/out");
fs.mkdirSync(outDir, { recursive: true });

// Parse the markdown table: rows "| # | t | Shot | Narration |"
const md = fs.readFileSync(path.resolve("video/narration.md"), "utf8");
const rows = md.split("\n").filter((l) => /^\|\s*\d+\s*\|/.test(l)).map((l) => {
  const cells = l.split("|").slice(1, -1).map((c) => c.trim());
  return { n: Number(cells[0]), target: cells[1], shot: cells[2], text: cells[3] };
});
if (!rows.length) { console.error("no narration rows found"); process.exit(1); }

async function tts(text, attempt = 0) {
  const body = {
    model,
    input: [{ type: "user_input", content: [{ type: "text", text, annotations: [{ type: "speech_metadata", style }] }] }],
    response_format: { type: "audio" },
    generation_config: { speech_config: [{ voice }] },
  };
  const res = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
    method: "POST",
    headers: { "x-goog-api-key": key, "Content-Type": "application/json", "Api-Revision": "2026-05-20" },
    body: JSON.stringify(body),
  });
  if (res.status === 429 && attempt < 4) {
    const txt = await res.text();
    const m = txt.match(/retry in (?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/i);
    const wait = m ? ((+m[1] || 0) * 3600 + (+m[2] || 0) * 60 + (+m[3] || 0)) : 60;
    if (wait > 900) throw new Error(`TTS daily quota exhausted: ${txt.slice(0, 200)}`);
    console.log(`rate limited; waiting ${wait + 2}s…`);
    await new Promise((r) => setTimeout(r, (wait + 2) * 1000));
    return tts(text, attempt + 1);
  }
  if (!res.ok) throw new Error(`TTS HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  let audio = null;
  (function find(o) { if (audio) return; if (Array.isArray(o)) o.forEach(find); else if (o && typeof o === "object") { if (o.type === "audio" && o.data) { audio = o; return; } Object.values(o).forEach(find); } })(data);
  if (!audio) throw new Error("no audio in response");
  return Buffer.from(audio.data, "base64");
}

function duration(file) {
  return Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file]).toString().trim());
}
const srtTime = (s) => { const ms = Math.round(s * 1000); const h = Math.floor(ms / 3600000), m = Math.floor(ms % 3600000 / 60000), sec = Math.floor(ms % 60000 / 1000), mm = ms % 1000; return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")},${String(mm).padStart(3, "0")}`; };

const segments = []; let t = 0; const GAP = 0.6; let srt = ""; let i = 0;
for (const row of rows) {
  const file = path.join(outDir, `seg-${String(row.n).padStart(2, "0")}.wav`);
  if (!fs.existsSync(file) || process.env.FORCE) {
    process.stdout.write(`segment ${row.n}… `);
    fs.writeFileSync(file, await tts(row.text));
    console.log("ok");
  }
  const d = duration(file);
  segments.push({ n: row.n, file: path.relative(process.cwd(), file), start: t, duration: d, shot: row.shot, text: row.text });
  srt += `${++i}\n${srtTime(t)} --> ${srtTime(t + d)}\n${row.text}\n\n`;
  t += d + GAP;
}
fs.writeFileSync(path.join(outDir, "segments.json"), JSON.stringify({ voice, model, gap: GAP, total: t, segments }, null, 2));
fs.writeFileSync(path.join(outDir, "narration.srt"), srt);
console.log(`\n${segments.length} segments, total ≈ ${t.toFixed(1)} s (target 120 s), voice ${voice}`);

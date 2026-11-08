#!/usr/bin/env node
/**
 * Live AI smoke test — makes REAL provider calls (counts against quota).
 *
 *   cd aftercare-loop-app && node scripts/ai-smoke.mjs
 *
 * Loads .env.local (without overriding variables already set in the shell),
 * resolves the provider exactly like the app (AFTERCARE_PROVIDER / keys /
 * AFTERCARE_FORCE_SCRIPTED), then runs generateStructured with a tiny schema and
 * generateText once each. Prints only provider, mode, model, ok/kind, token
 * usage and duration — never the key, prompts or model output.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { tsImport } from "tsx/esm/api";

const appDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envFile = resolve(appDir, ".env.local");

if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const m = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/.exec(line);
    if (!m || line.trim().startsWith("#")) continue;
    const [, name, raw] = m;
    if (process.env[name] !== undefined) continue;
    process.env[name] = raw.replace(/^(['"])(.*)\1$/, "$2");
  }
}

const ai = await tsImport("../src/lib/ai/client.ts", import.meta.url);
const { z } = await import("zod/v4");

const provider = ai.getActiveProvider();
console.log(
  JSON.stringify({
    provider: provider?.id ?? "scripted",
    setting: ai.getProviderSetting(),
    mode: ai.getAiMode(),
    model: ai.getModelId(),
  }),
);
if (!provider) {
  console.log("No live provider configured (scripted mode); nothing to call.");
  process.exit(0);
}

const Tiny = z.object({
  answer: z.string(),
  count: z.number(),
  tone: z.enum(["calm", "neutral"]),
  note: z.string().nullable(),
  steps: z.array(z.string()),
});

function report(name, res, started) {
  const line = { call: name, ok: res.ok, ms: Date.now() - started };
  if (res.ok) Object.assign(line, { model: res.model, usage: res.usage ?? null });
  else Object.assign(line, { kind: res.kind });
  console.log(JSON.stringify(line));
  return res.ok;
}

let t = Date.now();
const structured = await ai.generateStructured({
  system: "You are a test fixture. Return JSON only.",
  user: 'Return answer "ok", count 3, tone "calm", note null and two short steps.',
  schema: Tiny,
  effort: "medium",
  maxTokens: 1024,
  label: "smoke-structured",
});
const okA = report("generateStructured", structured, t);

t = Date.now();
const text = await ai.generateText({
  system: "You are a test fixture.",
  user: "Reply with one short friendly sentence.",
  effort: "medium",
  maxTokens: 512,
  label: "smoke-text",
});
const okB = report("generateText", text, t);

process.exit(okA && okB ? 0 : 1);

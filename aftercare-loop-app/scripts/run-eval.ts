/**
 * Reproducible evaluation runner (from aftercare-loop-app/):
 *
 *   npm run eval                                     scripted (deterministic) → eval-results/latest.json
 *   AFTERCARE_FORCE_SCRIPTED=false npm run eval -- --mode live --out latest-live.json
 *                                                    model-based run with the configured provider
 *
 * Flags (see parseEvalCliArgs in src/lib/eval/io.ts):
 *   --mode scripted|live   scripted (default) forces Scripted Demo Mode, so a plain
 *                          `npm run eval` never makes a network call. live uses the
 *                          provider configured via AFTERCARE_PROVIDER / keys and
 *                          refuses to run if none is active.
 *   --out <file.json>      filename inside eval-results/ (default latest.json).
 *   --concurrency <n>      extraction calls in flight (default 1 scripted, 3 live).
 *   --budget-min <m>       live only: no new model call starts after m minutes; the
 *                          remaining cases are recorded as not evaluated and the
 *                          file carries "partial": true.
 *
 * Loads .env.local like scripts/ai-smoke.mjs (never overriding variables already
 * set in the shell, never printing values). Live mode retries an HTTP 503 once
 * after 20 s. Logging: only ids, counts and metric values — never document text,
 * prompts, model output or keys.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { generateStructured, getAiMode, getProviderSetting } from "../src/lib/ai/client";
import { runDefaultEvaluation } from "../src/lib/eval/defaults";
import { defaultResultsDir, parseEvalCliArgs, writeEvalRun } from "../src/lib/eval/io";
import type { StoredEvalRun } from "../src/lib/eval/schema";
import { extractInstructionsDetailed, type GenerateStructuredFn } from "../src/lib/services/instruction-extraction";
import type { EvalMetric } from "../src/lib/types";

const RETRY_503_DELAY_MS = 20_000;
const BUDGET_SKIP_MESSAGE = "not run: live evaluation time budget exhausted";

/** Same rules as scripts/ai-smoke.mjs: KEY=value lines, shell variables win, values never printed. */
function loadEnvLocal(appDir: string): boolean {
  const envFile = path.join(appDir, ".env.local");
  if (!existsSync(envFile)) return false;
  for (const line of readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const m = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/.exec(line);
    if (!m || line.trim().startsWith("#")) continue;
    const [, name, raw] = m;
    if (process.env[name!] !== undefined) continue;
    process.env[name!] = raw!.replace(/^(['"])(.*)\1$/, "$2");
  }
  return true;
}

function fmt(m: EvalMetric): string {
  if (m.value === null) return `${m.name}: Not evaluated`;
  if (m.unit === "ratio") return `${m.name}: ${m.numerator}/${m.denominator} = ${(m.value * 100).toFixed(1)}%`;
  return `${m.name}: ${m.value}${m.denominator !== null ? ` (of ${m.denominator})` : ""}`;
}

function summarize(run: StoredEvalRun): string {
  const lines = [
    `Run ${run.runId} — suite ${run.suiteVersion}, mode ${run.mode}, kind ${run.kind}${run.modelId ? `, model ${run.modelId}` : ""}${run.partial ? " — PARTIAL" : ""}`,
    `${run.caseCount} cases, ${run.cases.filter((c) => !c.passed).length} not passed, ${run.errors.length} errors`,
  ];
  for (const [suite, metrics] of Object.entries(run.metrics)) {
    lines.push(`\n[${suite}]`, ...metrics.map((m) => `  ${fmt(m)}`));
  }
  if (run.errors.length) lines.push("\n[errors]", ...run.errors.map((e) => `  ${e}`));
  return lines.join("\n");
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** generateStructured with one retry after 20 s when the provider answered HTTP 503. */
const generateWith503Retry: GenerateStructuredFn = async (req) => {
  const first = await generateStructured(req);
  if (first.ok || !/status 503\b/.test(first.error)) return first;
  console.log(`  [${req.label ?? "structured"}] HTTP 503 — retrying once in ${RETRY_503_DELAY_MS / 1000} s`);
  await sleep(RETRY_503_DELAY_MS);
  return generateStructured(req);
};

async function main(): Promise<void> {
  const opts = parseEvalCliArgs(process.argv.slice(2));
  const envLoaded = loadEnvLocal(process.cwd());
  if (opts.mode === "scripted") process.env.AFTERCARE_FORCE_SCRIPTED = "true";

  const mode = getAiMode();
  console.log(
    `Evaluation: --mode ${opts.mode}, provider setting ${getProviderSetting()}, active mode ${mode}, ` +
      `--out ${opts.out}${envLoaded ? " (.env.local loaded)" : ""}`,
  );
  if (opts.mode === "live" && mode === "scripted_demo") {
    throw new Error(
      "--mode live needs an active provider: set GEMINI_API_KEY or ANTHROPIC_API_KEY and AFTERCARE_FORCE_SCRIPTED=false.",
    );
  }

  let partial = false;
  const started = Date.now();
  const overrides =
    opts.mode === "live"
      ? {
          extractionConcurrency: opts.concurrency,
          extractInstructions: async (input: Parameters<typeof extractInstructionsDetailed>[0]) => {
            if (opts.budgetMs !== null && Date.now() - started > opts.budgetMs) {
              partial = true;
              throw new Error(BUDGET_SKIP_MESSAGE);
            }
            const t = Date.now();
            const result = await extractInstructionsDetailed(input, { generate: generateWith503Retry });
            console.log(
              `  extraction:${input.profile.id} via ${result.source} in ${Math.round((Date.now() - t) / 1000)} s` +
                (result.error ? " (live call failed; heuristic fallback)" : ""),
            );
            return result;
          },
        }
      : { extractionConcurrency: opts.concurrency };

  const run: StoredEvalRun = await runDefaultEvaluation(overrides);
  if (partial) run.partial = true;
  const { latest, archived } = await writeEvalRun(run, defaultResultsDir(), opts.out);
  console.log(summarize(run));
  console.log(`\nWrote ${latest}\nWrote ${archived}`);
  if (opts.mode === "live" && run.kind !== "model_based") {
    console.log("Warning: no extraction came from the live model; this run is recorded as deterministic_synthetic.");
  }
  console.log("Limited synthetic evaluation on fictional data — not clinical validation.");
}

main().catch((err: unknown) => {
  console.error("Evaluation failed:", err instanceof Error ? err.message : String(err));
  process.exitCode = 1;
});

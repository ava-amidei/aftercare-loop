/** Node-only persistence for eval runs (scripts/run-eval.ts and /api/eval/latest). */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { EvalRun } from "@/lib/types";
import { EvalRunSchema, type StoredEvalRun } from "./schema";

export const EVAL_RESULTS_DIRNAME = "eval-results";
/** The scripted (deterministic) run the dashboard shows first. */
export const LATEST_FILENAME = "latest.json";
/** The most recent model-based run, written by `npm run eval -- --mode live --out latest-live.json`. */
export const LATEST_LIVE_FILENAME = "latest-live.json";

/** eval-results/ relative to the app root (process.cwd() for `next` and `npm run eval`). */
export function defaultResultsDir(cwd: string = process.cwd()): string {
  return path.join(cwd, EVAL_RESULTS_DIRNAME);
}

/**
 * Validate an --out value: a bare `*.json` filename inside eval-results/ (no
 * directories, no traversal). Throws with a readable message otherwise.
 */
export function resolveOutFilename(out: string | undefined): string {
  const name = (out ?? LATEST_FILENAME).trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*\.json$/.test(name) || name.includes("..")) {
    throw new Error(`--out must be a plain .json filename inside ${EVAL_RESULTS_DIRNAME}/ (got "${name}")`);
  }
  return name;
}

/** Write `<runId>.json` and `<outFilename>` (default latest.json). Returns both paths. */
export async function writeEvalRun(
  run: EvalRun | StoredEvalRun,
  dir: string = defaultResultsDir(),
  outFilename: string = LATEST_FILENAME,
): Promise<{ latest: string; archived: string }> {
  const parsed = EvalRunSchema.parse(run);
  const outName = resolveOutFilename(outFilename);
  await mkdir(dir, { recursive: true });
  const body = `${JSON.stringify(parsed, null, 2)}\n`;
  const safeId = run.runId.replace(/[^A-Za-z0-9._-]/g, "-");
  const archived = path.join(dir, `${safeId}.json`);
  const latest = path.join(dir, outName);
  await writeFile(archived, body, "utf8");
  await writeFile(latest, body, "utf8");
  return { latest, archived };
}

export type ReadLatestResult =
  | { status: "ok"; run: StoredEvalRun }
  | { status: "missing" }
  | { status: "invalid"; reason: string };

/** Read and validate one stored run file from `dir`. */
export async function readEvalRunFile(dir: string, filename: string): Promise<ReadLatestResult> {
  let raw: string;
  try {
    raw = await readFile(path.join(dir, filename), "utf8");
  } catch (err) {
    if ((err as NodeJS.ErrnoException)?.code === "ENOENT") return { status: "missing" };
    throw err;
  }
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return { status: "invalid", reason: `${filename} is not valid JSON` };
  }
  const result = EvalRunSchema.safeParse(json);
  if (!result.success) return { status: "invalid", reason: `${filename} does not match the EvalRun schema` };
  return { status: "ok", run: result.data };
}

export async function readLatestEvalRun(dir: string = defaultResultsDir()): Promise<ReadLatestResult> {
  return readEvalRunFile(dir, LATEST_FILENAME);
}

/** Both the scripted run (latest.json) and the model-based run (latest-live.json). */
export async function readLatestEvalRuns(
  dir: string = defaultResultsDir(),
): Promise<{ scripted: ReadLatestResult; live: ReadLatestResult }> {
  const [scripted, live] = await Promise.all([readEvalRunFile(dir, LATEST_FILENAME), readEvalRunFile(dir, LATEST_LIVE_FILENAME)]);
  return { scripted, live };
}

// ---------------------------------------------------------------------------
// CLI flags for scripts/run-eval.ts
// ---------------------------------------------------------------------------

export type EvalCliMode = "scripted" | "live";

export interface EvalCliOptions {
  /** scripted (default): forces Scripted Demo Mode. live: uses the configured provider. */
  mode: EvalCliMode;
  /** Output filename inside eval-results/ (default latest.json). */
  out: string;
  /** Extraction calls in flight at once (default 1 scripted, 3 live). */
  concurrency: number;
  /** Live only: stop starting new model calls after this many ms and mark the run partial. */
  budgetMs: number | null;
}

/**
 * Parse `--mode scripted|live`, `--out <file.json>`, `--concurrency <n>` and
 * `--budget-min <minutes>` (both `--flag value` and `--flag=value`).
 */
export function parseEvalCliArgs(argv: readonly string[]): EvalCliOptions {
  const values = new Map<string, string>();
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    if (!arg.startsWith("--")) throw new Error(`Unexpected argument "${arg}"`);
    const eq = arg.indexOf("=");
    const name = eq === -1 ? arg.slice(2) : arg.slice(2, eq);
    const value = eq === -1 ? argv[++i] : arg.slice(eq + 1);
    if (!["mode", "out", "concurrency", "budget-min"].includes(name)) throw new Error(`Unknown flag --${name}`);
    if (value === undefined || value.startsWith("--")) throw new Error(`--${name} needs a value`);
    values.set(name, value);
  }

  const mode = (values.get("mode") ?? "scripted") as EvalCliMode;
  if (mode !== "scripted" && mode !== "live") throw new Error(`--mode must be "scripted" or "live" (got "${mode}")`);

  const concurrencyRaw = values.get("concurrency");
  const concurrency = concurrencyRaw === undefined ? (mode === "live" ? 3 : 1) : Number(concurrencyRaw);
  if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 12) {
    throw new Error("--concurrency must be an integer from 1 to 12");
  }

  const budgetRaw = values.get("budget-min");
  let budgetMs: number | null = null;
  if (budgetRaw !== undefined) {
    const minutes = Number(budgetRaw);
    if (!Number.isFinite(minutes) || minutes <= 0) throw new Error("--budget-min must be a positive number");
    budgetMs = Math.round(minutes * 60_000);
  }

  return { mode, out: resolveOutFilename(values.get("out")), concurrency, budgetMs };
}

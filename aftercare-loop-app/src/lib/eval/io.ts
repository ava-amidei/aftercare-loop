/** Node-only persistence for eval runs (scripts/run-eval.ts and /api/eval/latest). */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { EvalRun } from "@/lib/types";
import { EvalRunSchema } from "./schema";

export const EVAL_RESULTS_DIRNAME = "eval-results";
export const LATEST_FILENAME = "latest.json";

/** eval-results/ relative to the app root (process.cwd() for `next` and `npm run eval`). */
export function defaultResultsDir(cwd: string = process.cwd()): string {
  return path.join(cwd, EVAL_RESULTS_DIRNAME);
}

/** Write `<runId>.json` and `latest.json`. Returns both paths. */
export async function writeEvalRun(run: EvalRun, dir: string = defaultResultsDir()): Promise<{ latest: string; archived: string }> {
  const parsed = EvalRunSchema.parse(run);
  await mkdir(dir, { recursive: true });
  const body = `${JSON.stringify(parsed, null, 2)}\n`;
  const safeId = run.runId.replace(/[^A-Za-z0-9._-]/g, "-");
  const archived = path.join(dir, `${safeId}.json`);
  const latest = path.join(dir, LATEST_FILENAME);
  await writeFile(archived, body, "utf8");
  await writeFile(latest, body, "utf8");
  return { latest, archived };
}

export type ReadLatestResult =
  | { status: "ok"; run: EvalRun }
  | { status: "missing" }
  | { status: "invalid"; reason: string };

export async function readLatestEvalRun(dir: string = defaultResultsDir()): Promise<ReadLatestResult> {
  let raw: string;
  try {
    raw = await readFile(path.join(dir, LATEST_FILENAME), "utf8");
  } catch (err) {
    if ((err as NodeJS.ErrnoException)?.code === "ENOENT") return { status: "missing" };
    throw err;
  }
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return { status: "invalid", reason: "latest.json is not valid JSON" };
  }
  const result = EvalRunSchema.safeParse(json);
  if (!result.success) return { status: "invalid", reason: "latest.json does not match the EvalRun schema" };
  return { status: "ok", run: result.data };
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { EvalRunSchema, type StoredEvalRun } from "@/lib/eval/schema";

export const EVAL_LATEST_URL = "/api/eval/latest";

export type LatestEvalState =
  | { status: "loading" }
  /**
   * `run` = the scripted run (eval-results/latest.json); `live` = the model-based
   * run (eval-results/latest-live.json). Either may be null, never both.
   */
  | { status: "ready"; run: StoredEvalRun | null; live: StoredEvalRun | null; liveError?: string }
  /** 404 from the route: no run has been written yet. */
  | { status: "not_evaluated" }
  | { status: "error"; message?: string };

/**
 * Parse a /api/eval/latest response. Pure so it can be unit-tested without fetch.
 * The body is re-validated against the EvalRun schema; anything else is an error.
 */
export async function parseLatestEvalResponse(res: Response): Promise<LatestEvalState> {
  if (res.status === 404) return { status: "not_evaluated" };
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  if (!res.ok) {
    const message =
      body && typeof body === "object" && "error" in body && typeof (body as { error: unknown }).error === "string"
        ? (body as { error: string }).error
        : undefined;
    return { status: "error", message };
  }
  const invalid: LatestEvalState = { status: "error", message: "The evaluation results do not match the expected format." };
  if (!body || typeof body !== "object") return invalid;

  // Current shape: { scripted, live, liveError? }.
  if ("scripted" in body || "live" in body) {
    const b = body as { scripted?: unknown; live?: unknown; liveError?: unknown };
    const parseSlot = (v: unknown) => (v === null || v === undefined ? { ok: true as const, run: null } : parseRun(v));
    const scripted = parseSlot(b.scripted);
    const live = parseSlot(b.live);
    if (!scripted.ok) return invalid;
    if (!scripted.run && !live.ok) return invalid;
    const liveRun = live.ok ? live.run : null;
    if (!scripted.run && !liveRun) return { status: "not_evaluated" };
    const liveError =
      typeof b.liveError === "string" ? b.liveError : live.ok ? undefined : "The model-based results do not match the expected format.";
    return { status: "ready", run: scripted.run, live: liveRun, ...(liveError ? { liveError } : {}) };
  }

  // Legacy shape: a bare EvalRun, slotted by its kind.
  const single = parseRun(body);
  if (!single.ok) return invalid;
  return single.run.kind === "model_based"
    ? { status: "ready", run: null, live: single.run }
    : { status: "ready", run: single.run, live: null };
}

function parseRun(v: unknown): { ok: true; run: StoredEvalRun } | { ok: false } {
  const parsed = EvalRunSchema.safeParse(v);
  return parsed.success ? { ok: true, run: parsed.data } : { ok: false };
}

/** Fetches the latest evaluation runs once on mount; `reload()` refetches. */
export function useLatestEval(fetchImpl: typeof fetch = globalThis.fetch): LatestEvalState & { reload: () => void } {
  const [state, setState] = useState<LatestEvalState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    fetchImpl(EVAL_LATEST_URL, { cache: "no-store", signal: controller.signal })
      .then(parseLatestEvalResponse)
      .then((next) => {
        if (!controller.signal.aborted) setState(next);
      })
      .catch(() => {
        if (!controller.signal.aborted) setState({ status: "error" });
      });
    return () => controller.abort();
  }, [attempt, fetchImpl]);

  const reload = useCallback(() => {
    setState({ status: "loading" });
    setAttempt((n) => n + 1);
  }, []);

  return { ...state, reload };
}

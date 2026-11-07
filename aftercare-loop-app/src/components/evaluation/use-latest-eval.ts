"use client";

import { useCallback, useEffect, useState } from "react";
import type { EvalRun } from "@/lib/types";
import { EvalRunSchema } from "@/lib/eval/schema";

export const EVAL_LATEST_URL = "/api/eval/latest";

export type LatestEvalState =
  | { status: "loading" }
  | { status: "ready"; run: EvalRun }
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
  const parsed = EvalRunSchema.safeParse(body);
  if (!parsed.success) return { status: "error", message: "The evaluation results do not match the expected format." };
  return { status: "ready", run: parsed.data };
}

/** Fetches the latest evaluation run once on mount; `reload()` refetches. */
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

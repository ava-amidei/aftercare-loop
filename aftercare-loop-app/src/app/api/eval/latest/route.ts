/**
 * GET /api/eval/latest — the most recent evaluation runs:
 *   { scripted: EvalRun | null, live: EvalRun | null, liveError?: string }
 * `scripted` is eval-results/latest.json (`npm run eval`); `live` is
 * eval-results/latest-live.json (`npm run eval -- --mode live --out latest-live.json`)
 * when present. 404 { notEvaluated: true } when neither file exists. Numbers are
 * never hardcoded: the files are produced by the eval runner.
 */
import { NextResponse } from "next/server";
import { readLatestEvalRuns } from "@/lib/eval/io";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(): Promise<NextResponse> {
  try {
    const { scripted, live } = await readLatestEvalRuns();
    if (scripted.status === "missing" && live.status === "missing") {
      return NextResponse.json({ notEvaluated: true }, { status: 404 });
    }
    if (scripted.status === "invalid") {
      return NextResponse.json({ notEvaluated: true, error: "Stored evaluation results are unreadable." }, { status: 500 });
    }
    return NextResponse.json(
      {
        scripted: scripted.status === "ok" ? scripted.run : null,
        live: live.status === "ok" ? live.run : null,
        ...(live.status === "invalid" ? { liveError: "Stored model-based results are unreadable." } : {}),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json({ error: "Could not read evaluation results." }, { status: 500 });
  }
}

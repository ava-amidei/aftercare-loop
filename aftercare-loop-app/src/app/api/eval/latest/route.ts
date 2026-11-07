/**
 * GET /api/eval/latest — the most recent evaluation run (eval-results/latest.json).
 * 404 { notEvaluated: true } when no run has been written yet. Numbers are never
 * hardcoded: the file is produced by `npm run eval`.
 */
import { NextResponse } from "next/server";
import { readLatestEvalRun } from "@/lib/eval/io";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(): Promise<NextResponse> {
  try {
    const result = await readLatestEvalRun();
    if (result.status === "missing") {
      return NextResponse.json({ notEvaluated: true }, { status: 404 });
    }
    if (result.status === "invalid") {
      return NextResponse.json({ notEvaluated: true, error: "Stored evaluation results are unreadable." }, { status: 500 });
    }
    return NextResponse.json(result.run, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Could not read evaluation results." }, { status: 500 });
  }
}

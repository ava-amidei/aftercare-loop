import { describe, expect, it } from "vitest";
import type { ChatMessage, PatientSessionState } from "@/lib/types";
import { buildInitialSessionState } from "@/lib/store";
import { documentsByPatient, patients } from "@/data/patients";
import { t } from "@/lib/i18n";
import {
  buildActionPlanBody,
  buildAskKatBody,
  buildHistory,
  buildWelcomeMessage,
  errorFromBody,
  hrefForAction,
  isKatHiddenOn,
  isWelcomeMessage,
  panelModeOf,
  withViewActionPlan,
} from "./kat-client";

const msg = (role: ChatMessage["role"], content: string, extra: Partial<ChatMessage> = {}): ChatMessage => ({
  id: `m-${Math.random().toString(36).slice(2)}`,
  role,
  content,
  createdAt: "2026-01-01T00:00:00.000Z",
  ...extra,
});

function session(): PatientSessionState {
  const profile = patients[0]!;
  return buildInitialSessionState(profile, documentsByPatient[profile.id] ?? []);
}

describe("welcome message", () => {
  it("uses the exact SPEC §12.1 text and is recognisable", () => {
    const w = buildWelcomeMessage("pt-x", t("en", "askKat.welcome"));
    expect(w.content).toBe(
      "Hi! I'm Kat. 💗\nI'm here to help you understand your health information, explore reliable resources, and prepare questions for your care team.\nWhat's on your mind today?",
    );
    expect(w.role).toBe("assistant");
    expect(w.meta).toBeUndefined();
    expect(isWelcomeMessage(w)).toBe(true);
    expect(isWelcomeMessage(msg("assistant", "x"))).toBe(false);
  });
});

describe("buildHistory", () => {
  it("drops welcome, errors and the trailing user turn; keeps the last 10", () => {
    const chat: ChatMessage[] = [buildWelcomeMessage("p", "hi")];
    for (let i = 0; i < 8; i++) chat.push(msg("user", `q${i}`), msg("assistant", `a${i}`));
    chat.push(msg("assistant", "oops", { error: "boom" }));
    chat.push(msg("user", "current"));
    const h = buildHistory(chat);
    expect(h).toHaveLength(10);
    expect(h[h.length - 1]).toEqual({ role: "assistant", content: "a7" });
    expect(h.some((m) => m.content === "hi" || m.content === "oops" || m.content === "current")).toBe(false);
  });
});

describe("buildAskKatBody", () => {
  it("sends one patient's context with the active document id only (fixture text stays server-side)", () => {
    const s = session();
    s.savedQuestions = ["Saved?"];
    s.chat = [msg("user", "earlier"), msg("assistant", "reply"), msg("user", "now")];
    const body = buildAskKatBody(s, "now", "what_should_i_ask");
    expect(body.patientId).toBe(s.profile.id);
    expect(body.quickPrompt).toBe("what_should_i_ask");
    expect(body.context.documentId).toBe(s.activeDocumentId);
    expect(body.context.document).toBeUndefined();
    expect(body.context.savedQuestions).toEqual(["Saved?"]);
    expect(body.history).toEqual([
      { role: "user", content: "earlier" },
      { role: "assistant", content: "reply" },
    ]);
  });

  it("includes pasted documents in full", () => {
    const s = session();
    const pasted = { ...s.documents[0]!, id: "doc-pasted", source: "pasted" as const };
    s.documents.push(pasted);
    s.activeDocumentId = pasted.id;
    expect(buildAskKatBody(s, "hi").context.document?.id).toBe("doc-pasted");
    expect(buildActionPlanBody(s)?.document?.id).toBe("doc-pasted");
  });

  it("action-plan body is null without a document", () => {
    const s = session();
    s.activeDocumentId = undefined;
    expect(buildActionPlanBody(s)).toBeNull();
  });
});

describe("panelModeOf", () => {
  const meta = (mode: "live_claude" | "scripted_demo", generatedBy?: "model" | "scripted" | "deterministic") => ({
    mode,
    generatedAt: "",
    disclaimer: "",
    generatedBy,
  });
  it("prefers non-deterministic replies, falls back, never guesses", () => {
    expect(panelModeOf([])).toBeUndefined();
    expect(panelModeOf([], "live_claude")).toBe("live_claude");
    expect(
      panelModeOf([
        msg("assistant", "a", { meta: meta("live_claude", "model") }),
        msg("assistant", "b", { meta: meta("scripted_demo", "deterministic") }),
      ]),
    ).toBe("live_claude");
    expect(panelModeOf([msg("assistant", "b", { meta: meta("scripted_demo", "deterministic") })])).toBe(
      "scripted_demo",
    );
  });
});

describe("actions & routes", () => {
  it("maps contextual actions to routes", () => {
    expect(hrefForAction({ kind: "check_understanding", label: "", payload: { questionIds: ["q 1", "q2"] } })).toBe(
      "/check?questionId=q%201",
    );
    expect(hrefForAction({ kind: "check_understanding", label: "" })).toBe("/check");
    expect(hrefForAction({ kind: "view_action_plan", label: "" })).toBe("/action-plan");
    expect(hrefForAction({ kind: "prepare_appointment", label: "" })).toBe("/follow-up");
    expect(hrefForAction({ kind: "add_question", label: "" })).toBeNull();
  });

  it("adds View my action plan once", () => {
    const m = withViewActionPlan(msg("assistant", "x"), "View my action plan");
    expect(m.actions).toHaveLength(1);
    expect(withViewActionPlan(m, "again").actions).toHaveLength(1);
  });

  it("hides Kat on clinician/evaluation routes only", () => {
    expect(isKatHiddenOn("/care-team")).toBe(true);
    expect(isKatHiddenOn("/evaluation/")).toBe(true);
    expect(isKatHiddenOn("/")).toBe(false);
    expect(isKatHiddenOn("/understand")).toBe(false);
  });

  it("extracts safe API errors", () => {
    expect(errorFromBody({ error: "Unknown patient." }, "fallback")).toBe("Unknown patient.");
    expect(errorFromBody(null, "fallback")).toBe("fallback");
  });
});

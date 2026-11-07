"use client";
/**
 * Ask Kat conversation runtime.
 *
 * Persisted chat lives in useDemoStore (per patient). Transient state — which
 * patient has a reply in flight, the last failed request (for Retry), and
 * whether the panel was minimized — lives in a small non-persisted store so a
 * reply still lands in the right patient's history if the panel is closed or
 * the patient is switched mid-request.
 */
import { useCallback } from "react";
import { create } from "zustand";
import type { ChatMessage, KatResponse, PatientId, QuickPromptId, ActionItem } from "@/lib/types";
import { useDemoStore } from "@/lib/store";
import { getTranslator } from "@/lib/i18n";
import { createId } from "@/lib/utils/ids";
import {
  buildActionPlanBody,
  buildAskKatBody,
  buildWelcomeMessage,
  errorFromBody,
  withViewActionPlan,
} from "./kat-client";

export interface KatFailure {
  error: string;
  message: string;
  quickPrompt?: QuickPromptId;
}

interface KatRuntimeState {
  pending: Record<PatientId, boolean>;
  failures: Record<PatientId, KatFailure | undefined>;
  minimized: boolean;
  setPending(id: PatientId, v: boolean): void;
  setFailure(id: PatientId, f: KatFailure | undefined): void;
  setMinimized(v: boolean): void;
  reset(): void;
}

export const useKatRuntime = create<KatRuntimeState>()((set) => ({
  pending: {},
  failures: {},
  minimized: false,
  setPending: (id, v) => set((s) => ({ pending: { ...s.pending, [id]: v } })),
  setFailure: (id, f) => set((s) => ({ failures: { ...s.failures, [id]: f } })),
  setMinimized: (v) => set({ minimized: v }),
  reset: () => set({ pending: {}, failures: {}, minimized: false }),
}));

export interface KatDeps {
  fetch: typeof fetch;
  /** Called with UI notices (plan created / plan failed). */
  notify?: (kind: "plan_created" | "plan_error") => void;
}

function langOf(patientId: PatientId) {
  return useDemoStore.getState().patients[patientId]?.profile.language ?? "en";
}

/**
 * Appends the SPEC §12.1 welcome the first time Kat is opened for the active
 * patient (store.katHasOpenedOnce), then records the open. Safe to call again.
 */
export function openKat(): void {
  const state = useDemoStore.getState();
  const pid = state.activePatientId;
  const session = state.patients[pid];
  if (session && !state.katHasOpenedOnce[pid] && session.chat.length === 0) {
    const t = getTranslator(session.profile.language);
    state.appendChat(pid, buildWelcomeMessage(pid, t("askKat.welcome")));
  }
  useKatRuntime.getState().setMinimized(false);
  state.setKatOpen(true);
}

/** Clears one patient's conversation and restores the welcome greeting. */
export function clearKatChat(patientId: PatientId): void {
  const state = useDemoStore.getState();
  const session = state.patients[patientId];
  if (!session) return;
  state.clearChat(patientId);
  state.appendChat(patientId, buildWelcomeMessage(patientId, getTranslator(session.profile.language)("askKat.welcome")));
  useKatRuntime.getState().setFailure(patientId, undefined);
}

async function postJson(f: typeof fetch, url: string, body: unknown): Promise<{ ok: boolean; data: unknown }> {
  const res = await f(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  return { ok: res.ok, data };
}

function isKatResponse(v: unknown): v is KatResponse {
  if (!v || typeof v !== "object") return false;
  const m = (v as { message?: unknown }).message;
  return !!m && typeof m === "object" && typeof (m as ChatMessage).content === "string";
}

/** If plan_next_steps is chosen and the patient has no actions yet, build the plan first. */
async function ensureActionPlan(patientId: PatientId, deps: KatDeps): Promise<boolean> {
  const session = useDemoStore.getState().patients[patientId];
  if (!session) return false;
  if (session.actions.length > 0) return true;
  const body = buildActionPlanBody(session);
  if (!body) return false;
  try {
    const { ok, data } = await postJson(deps.fetch, "/api/action-plan", body);
    const actions = (data as { actions?: ActionItem[] } | null)?.actions;
    if (!ok || !Array.isArray(actions)) {
      deps.notify?.("plan_error");
      return false;
    }
    if (actions.length > 0) {
      useDemoStore.getState().upsertActions(patientId, actions);
      deps.notify?.("plan_created");
    }
    return actions.length > 0;
  } catch {
    deps.notify?.("plan_error");
    return false;
  }
}

/** Runs one request for `patientId`. The user's message must already be the last chat entry. */
export async function requestKatReply(
  patientId: PatientId,
  message: string,
  quickPrompt: QuickPromptId | undefined,
  deps: KatDeps,
): Promise<void> {
  const runtime = useKatRuntime.getState();
  const t = getTranslator(langOf(patientId));
  runtime.setPending(patientId, true);
  runtime.setFailure(patientId, undefined);
  try {
    let hasPlan = false;
    if (quickPrompt === "plan_next_steps") hasPlan = await ensureActionPlan(patientId, deps);

    const session = useDemoStore.getState().patients[patientId];
    if (!session) return;
    const { ok, data } = await postJson(deps.fetch, "/api/ask-kat", buildAskKatBody(session, message, quickPrompt));
    if (!ok || !isKatResponse(data)) {
      useKatRuntime.getState().setFailure(patientId, {
        error: errorFromBody(data, t("askKat.error")),
        message,
        quickPrompt,
      });
      return;
    }
    let reply = data.message;
    if (reply.error) {
      useKatRuntime.getState().setFailure(patientId, { error: reply.error, message, quickPrompt });
      return;
    }
    if (quickPrompt === "plan_next_steps" && reply.safety?.level !== "emergency") {
      const now = useDemoStore.getState().patients[patientId];
      if (hasPlan || (now && now.actions.length > 0)) {
        reply = withViewActionPlan(reply, t("askKat.action.view_action_plan"));
      }
    }
    useDemoStore.getState().appendChat(patientId, { ...reply, role: "assistant", id: reply.id || createId("msg") });
  } catch {
    useKatRuntime.getState().setFailure(patientId, { error: t("askKat.error"), message, quickPrompt });
  } finally {
    useKatRuntime.getState().setPending(patientId, false);
  }
}

/** Appends the user's message, then asks Kat. */
export async function sendKatMessage(
  patientId: PatientId,
  text: string,
  quickPrompt: QuickPromptId | undefined,
  deps: KatDeps,
): Promise<void> {
  const content = text.trim();
  if (!content) return;
  if (useKatRuntime.getState().pending[patientId]) return;
  const userMsg: ChatMessage = {
    id: createId("msg"),
    role: "user",
    content,
    createdAt: new Date().toISOString(),
    ...(quickPrompt ? { quickPrompt } : {}),
  };
  useDemoStore.getState().appendChat(patientId, userMsg);
  await requestKatReply(patientId, content, quickPrompt, deps);
}

/** Retries the last failed request without duplicating the user's message. */
export async function retryKat(patientId: PatientId, deps: KatDeps): Promise<void> {
  const failure = useKatRuntime.getState().failures[patientId];
  if (!failure || useKatRuntime.getState().pending[patientId]) return;
  await requestKatReply(patientId, failure.message, failure.quickPrompt, deps);
}

/** React binding for the active patient. */
export function useKatChat(deps: KatDeps) {
  const patientId = useDemoStore((s) => s.activePatientId);
  const pending = useKatRuntime((s) => !!s.pending[patientId]);
  const failure = useKatRuntime((s) => s.failures[patientId]);
  const { fetch: f, notify } = deps;

  const send = useCallback(
    (text: string, quickPrompt?: QuickPromptId) => sendKatMessage(patientId, text, quickPrompt, { fetch: f, notify }),
    [patientId, f, notify],
  );
  const retry = useCallback(() => retryKat(patientId, { fetch: f, notify }), [patientId, f, notify]);

  return { patientId, pending, failure, send, retry };
}

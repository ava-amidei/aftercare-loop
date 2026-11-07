"use client";

import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { useRouter } from "next/navigation";
import { Minus, RotateCcw, SendHorizontal, Trash2 } from "lucide-react";
import type { ChatMessage, KatContextualAction, QuickPromptId, SourceRef, VisitDocument } from "@/lib/types";
import { Alert, Button, EmptyState, LoadingRegion, ModeBadge, SkeletonText, Sheet, useToast } from "@/components/ui";
import { SourceViewer } from "@/components/understand/SourceViewer";
import { useDemoStore, useHasHydrated } from "@/lib/store";
import { quickPromptKey, useT } from "@/lib/i18n";
import { activeDocumentOf, hasUserMessages, hrefForAction, isWelcomeMessage, panelModeOf, questionOf } from "./kat-client";
import { KatIcon } from "./KatFab";
import { KatMessage } from "./KatMessage";
import { KatSuggestionChips } from "./KatSuggestionChips";
import { clearKatChat, useKatChat } from "./use-kat-chat";

const EMPTY_CHAT: ChatMessage[] = [];
const EMPTY_QUESTIONS: string[] = [];
const EMPTY_DOCS: VisitDocument[] = [];

const DESKTOP_QUERY = "(min-width: 768px)";

/** Late-bound so tests can stub globalThis.fetch. */
const defaultFetch: typeof fetch = (input, init) => fetch(input, init);

function subscribeMedia(cb: () => void) {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return () => {};
  const mql = window.matchMedia(DESKTOP_QUERY);
  mql.addEventListener?.("change", cb);
  return () => mql.removeEventListener?.("change", cb);
}
const getMedia = () =>
  typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia(DESKTOP_QUERY).matches;

function useIsDesktop(): boolean {
  return useSyncExternalStore(subscribeMedia, getMedia, () => false);
}

export interface KatPanelProps {
  open: boolean;
  /** Close the panel (history is kept). */
  onClose: () => void;
  /** Collapse to the FAB, keeping history and marking the conversation as minimized. */
  onMinimize: () => void;
  /** Injected for tests; defaults to the global fetch. */
  fetchImpl?: typeof fetch;
}

export function KatPanel({ open, onClose, onMinimize, fetchImpl }: KatPanelProps) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const hydrated = useHasHydrated();
  const isDesktop = useIsDesktop();

  const session = useDemoStore((s) => s.patients[s.activePatientId]);
  const chat = session?.chat ?? EMPTY_CHAT;
  const savedQuestions = session?.savedQuestions ?? EMPTY_QUESTIONS;
  const documents = session?.documents ?? EMPTY_DOCS;
  const profileName = session?.profile.displayName ?? "";
  const reducedMotion = session?.profile.accessibility.includes("reduced_motion") ?? false;
  const interpretationMode = session && activeDocumentOf(session)
    ? session.interpretations[session.activeDocumentId!]?.meta?.mode
    : undefined;

  const notify = useCallback(
    (kind: "plan_created" | "plan_error") => {
      if (kind === "plan_created") toast({ title: t("askKat.planCreated"), variant: "success" });
      else toast({ title: t("askKat.planError"), variant: "warning" });
    },
    [toast, t],
  );
  const f = fetchImpl ?? defaultFetch;
  const { patientId, pending, failure, send, retry } = useKatChat({ fetch: f, notify });

  // Draft text and the open source viewer are scoped to the patient they belong to.
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const draft = drafts[patientId] ?? "";
  const setDraft = (text: string) => setDrafts((d) => ({ ...d, [patientId]: text }));
  const [viewerState, setViewer] = useState<{
    patientId: string;
    document: VisitDocument;
    sourceRef: SourceRef;
  } | null>(null);
  const viewer = viewerState?.patientId === patientId ? viewerState : null;
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const mode = panelModeOf(chat, interpretationMode);
  const started = hasUserMessages(chat);

  // Auto-scroll to the newest message / indicator.
  useEffect(() => {
    if (!open) return;
    const el = endRef.current;
    if (el && typeof el.scrollIntoView === "function") {
      el.scrollIntoView({ block: "end", behavior: reducedMotion ? "auto" : "smooth" });
    }
  }, [open, chat.length, pending, failure, reducedMotion]);

  const docById = useMemo(() => new Map(documents.map((d) => [d.id, d] as const)), [documents]);
  const canViewSource = useCallback((ref: SourceRef) => docById.has(ref.documentId), [docById]);
  const onViewSource = useCallback(
    (ref: SourceRef) => {
      const document = docById.get(ref.documentId);
      if (!document) {
        toast({ title: t("askKat.sourceUnavailable"), variant: "warning" });
        return;
      }
      setViewer({ patientId, document, sourceRef: ref });
    },
    [docById, toast, t, patientId],
  );

  const onAction = useCallback(
    (action: KatContextualAction) => {
      if (action.kind === "add_question") {
        const q = questionOf(action);
        if (!q) return;
        useDemoStore.getState().addSavedQuestion(patientId, q);
        toast({ title: t("askKat.questionAdded"), description: q, variant: "success" });
        return;
      }
      const href = hrefForAction(action);
      if (href) {
        router.push(href);
        onMinimize();
      }
    },
    [patientId, router, toast, t, onMinimize],
  );

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    const text = draft.trim();
    if (!text || pending) return;
    setDraft("");
    void send(text);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  };

  const onChip = (id: QuickPromptId) => {
    if (id === "free_text") {
      inputRef.current?.focus();
      return;
    }
    // Welcome chips unmount once the chat starts; keep focus in the panel.
    inputRef.current?.focus({ preventScroll: true });
    void send(t(quickPromptKey(id)), id);
  };

  let lastWelcomeIndex = -1;
  chat.forEach((m, i) => {
    if (isWelcomeMessage(m)) lastWelcomeIndex = i;
  });

  return (
    <>
      <Sheet
        open={open}
        onOpenChange={(o) => {
          if (!o) onClose();
        }}
        modal={!isDesktop}
        title={t("askKat.panelTitle")}
        description={<span className="hidden sm:inline">{t("askKat.subtitle")}</span>}
        closeLabel={t("askKat.close")}
        headerIcon={
          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-accent-100 text-accent-800">
            <KatIcon />
          </span>
        }
        headerActions={
          <>
            {mode && <ModeBadge mode={mode} compact className="hidden text-xs min-[400px]:inline-flex" />}
            <button
              type="button"
              onClick={onMinimize}
              aria-label={t("askKat.minimize")}
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-control text-ink-muted hover:bg-surface-muted hover:text-ink"
            >
              <Minus aria-hidden="true" className="size-5" />
            </button>
          </>
        }
        className="md:shadow-2xl"
        bodyClassName="flex flex-col gap-3 bg-canvas"
        footer={
          <div className="flex flex-col gap-2">
            {started && <KatSuggestionChips t={t} onSelect={onChip} disabled={pending} compact />}
            <form onSubmit={submit} className="flex items-end gap-2">
              <label htmlFor="kat-input" className="sr-only">
                {t("askKat.input.label")}
              </label>
              <textarea
                id="kat-input"
                ref={inputRef}
                rows={1}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={onKeyDown}
                maxLength={4000}
                placeholder={t("askKat.input.placeholder")}
                className="max-h-36 min-h-12 flex-1 resize-none rounded-control border border-border-strong bg-surface px-3.5 py-3 text-base leading-snug text-ink placeholder:text-ink-muted focus-visible:border-brand-600 focus-visible:outline-3 focus-visible:outline-offset-1 focus-visible:outline-brand-600/40 field-sizing-content"
              />
              <Button
                type="submit"
                variant="accent"
                size="icon"
                className="size-12"
                aria-label={t("askKat.send")}
                disabled={!draft.trim() || pending}
              >
                <SendHorizontal aria-hidden="true" className="size-5" />
              </Button>
            </form>
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-ink-muted">{t("askKat.notAClinician")}</p>
              {started && (
                <button
                  type="button"
                  onClick={() => clearKatChat(patientId)}
                  disabled={pending}
                  className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-control px-2 text-xs font-medium text-ink-muted hover:bg-surface-muted hover:text-ink disabled:opacity-60"
                >
                  <Trash2 aria-hidden="true" className="size-3.5" />
                  {t("askKat.clearChat")}
                </button>
              )}
            </div>
          </div>
        }
      >
        {mode === "scripted_demo" && (
          <div data-testid="kat-scripted-banner">
            <ModeBadge mode="scripted_demo" className="w-full" />
          </div>
        )}
        {profileName && <p className="text-xs text-ink-muted">{t("askKat.contextFor", { name: profileName })}</p>}

        {!hydrated ? (
          <LoadingRegion label={t("askKat.hydrating")}>
            <SkeletonText lines={3} />
          </LoadingRegion>
        ) : chat.length === 0 ? (
          <EmptyState
            headingLevel="h3"
            icon={<KatIcon />}
            title={t("askKat.empty.title")}
            description={t("askKat.empty.body")}
            action={<KatSuggestionChips t={t} onSelect={onChip} disabled={pending} />}
          />
        ) : (
          <ol role="log" aria-label={t("askKat.messagesLabel")} className="flex flex-col gap-3">
            {chat.map((m, i) => (
              <Fragment key={m.id}>
                <KatMessage
                  message={m}
                  t={t}
                  savedQuestions={savedQuestions}
                  canViewSource={canViewSource}
                  onViewSource={onViewSource}
                  onAction={onAction}
                />
                {!started && i === lastWelcomeIndex && (
                  <li className="pl-10" data-testid="kat-welcome-chips">
                    <KatSuggestionChips t={t} onSelect={onChip} disabled={pending} />
                  </li>
                )}
              </Fragment>
            ))}
            {pending && (
              <li className="flex items-center gap-2 pl-10 text-sm text-ink-muted" role="status" data-testid="kat-thinking">
                <span aria-hidden="true" className="flex gap-1">
                  <span className="size-2 rounded-full bg-accent-400 motion-safe:animate-pulse" />
                  <span className="size-2 rounded-full bg-accent-400 motion-safe:animate-pulse [animation-delay:150ms]" />
                  <span className="size-2 rounded-full bg-accent-400 motion-safe:animate-pulse [animation-delay:300ms]" />
                </span>
                {t("askKat.thinking")}
              </li>
            )}
            {failure && !pending && (
              <li data-testid="kat-error">
                <Alert
                  variant="warning"
                  title={t("askKat.error")}
                  action={
                    <Button
                      variant="secondary"
                      size="sm"
                      leftIcon={<RotateCcw aria-hidden="true" className="size-4" />}
                      onClick={() => void retry()}
                    >
                      {t("askKat.retry")}
                    </Button>
                  }
                >
                  {failure.error !== t("askKat.error") && <p className="text-sm">{failure.error}</p>}
                </Alert>
              </li>
            )}
          </ol>
        )}
        <div ref={endRef} />
      </Sheet>
      {viewer && (
        <SourceViewer
          document={viewer.document}
          sourceRef={viewer.sourceRef}
          open
          onOpenChange={(o: boolean) => {
            if (!o) setViewer(null);
          }}
        />
      )}
    </>
  );
}

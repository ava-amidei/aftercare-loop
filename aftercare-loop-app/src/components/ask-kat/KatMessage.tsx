"use client";

import { ArrowTopRightOnSquareIcon, ExclamationTriangleIcon, ShieldExclamationIcon } from "@heroicons/react/24/outline";
import { ArrowRightIcon, CheckIcon, DocumentTextIcon, PlusIcon } from "@heroicons/react/20/solid";
import type { ChatMessage, KatContextualAction, SourceRef } from "@/lib/types";
import { Alert, Button, ModeBadge, OriginBadge } from "@/components/ui";
import { getReferenceById } from "@/data/evidence";
import { evidenceKindKey, katActionKey, originKey, type Translator } from "@/lib/i18n";
import { cn } from "@/lib/utils/cn";
import { isSourceRef, isWelcomeMessage, questionOf, sameRef } from "./kat-client";
import { KatIcon } from "./KatFab";

export interface KatMessageProps {
  message: ChatMessage;
  t: Translator;
  savedQuestions: readonly string[];
  /** Whether a document exists for this ref (enables "View source"). */
  canViewSource: (ref: SourceRef) => boolean;
  onViewSource: (ref: SourceRef) => void;
  onAction: (action: KatContextualAction) => void;
}

function UserBubble({ message, t }: { message: ChatMessage; t: Translator }) {
  return (
    <li className="flex justify-end" data-role="user">
      <div className="max-w-[85%] rounded-3xl rounded-br-lg bg-primary px-4 py-2.5 text-primary-contrast">
        <span className="sr-only">{t("askKat.you")}: </span>
        <p className="break-words whitespace-pre-line">{message.content}</p>
      </div>
    </li>
  );
}

function Avatar() {
  return (
    <span
      aria-hidden="true"
      className="mt-1 inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-accent-100 text-accent-800"
    >
      <KatIcon className="size-5 [&>svg:first-child]:size-5" />
    </span>
  );
}

/** Emergency verdict: prominent guidance and nothing else (ARCHITECTURE §2.6). */
function EmergencyMessage({ message, t }: { message: ChatMessage; t: Translator }) {
  const guidance = message.safety?.guidance?.trim() || message.content;
  const crisis = message.safety?.scenario === "suicidal_ideation_or_self_harm";
  return (
    <li data-role="assistant" data-safety="emergency">
      <Alert
        variant="danger"
        live
        icon={<ShieldExclamationIcon aria-hidden="true" className="mt-0.5 size-6 shrink-0 text-danger" />}
        title={crisis ? t("safety.crisis.title") : t("safety.emergency.title")}
        className="ring-2 ring-inset ring-danger"
        data-testid="kat-emergency"
      >
        <p className="font-medium whitespace-pre-line">{guidance}</p>
      </Alert>
    </li>
  );
}

function SourcesList({ ids, t }: { ids: readonly string[]; t: Translator }) {
  // Only references that exist in the curated index are shown — never invented.
  const refs = ids.map((id) => getReferenceById(id)).filter((r) => r !== undefined);
  if (refs.length === 0) return null;
  return (
    <div className="mt-3 border-t border-gray-10 pt-2">
      <p className="text-xs font-semibold tracking-wide text-gray-70 uppercase">{t("askKat.sources")}</p>
      <ul className="mt-1 flex flex-col gap-1.5">
        {refs.map((r) => (
          <li key={r.id} className="text-sm">
            <a
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-6 items-start gap-1 font-medium text-primary-800 underline underline-offset-2 hover:text-primary-900"
            >
              <span>{r.title}</span>
              <ArrowTopRightOnSquareIcon aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
              <span className="sr-only"> {t("common.opensInNewTab")}</span>
            </a>
            <span className="block text-xs text-gray-70">
              {r.organization} · {t(evidenceKindKey(r.kind))}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SourceRefs({
  refs,
  t,
  canViewSource,
  onViewSource,
}: {
  refs: readonly SourceRef[];
  t: Translator;
  canViewSource: (ref: SourceRef) => boolean;
  onViewSource: (ref: SourceRef) => void;
}) {
  if (refs.length === 0) return null;
  return (
    <ul className="mt-3 flex flex-col gap-2">
      {refs.map((ref) => {
        const available = canViewSource(ref);
        return (
          <li
            key={`${ref.documentId}:${ref.start}:${ref.end}`}
            className="rounded-2xl bg-origin-clinician-soft p-2.5"
          >
            <OriginBadge origin="clinician_documented" size="sm" label={t(originKey("clinician_documented"))} />
            <blockquote className="mt-1.5 line-clamp-3 border-l-2 border-origin-clinician/50 pl-2 text-sm text-gray-90">
              “{ref.quote}”
            </blockquote>
            <Button
              variant="ghost"
              size="sm"
              className="mt-1 -ml-2"
              leftIcon={<DocumentTextIcon aria-hidden="true" className="size-4" />}
              disabled={!available}
              title={available ? undefined : t("askKat.sourceUnavailable")}
              onClick={() => onViewSource(ref)}
            >
              {t("askKat.viewSource")}
            </Button>
          </li>
        );
      })}
    </ul>
  );
}

function ActionsList({
  actions,
  sourceRefs,
  t,
  savedQuestions,
  canViewSource,
  onViewSource,
  onAction,
}: {
  actions: readonly KatContextualAction[];
  sourceRefs: readonly SourceRef[];
  t: Translator;
  savedQuestions: readonly string[];
  canViewSource: (ref: SourceRef) => boolean;
  onViewSource: (ref: SourceRef) => void;
  onAction: (action: KatContextualAction) => void;
}) {
  const questions = actions.filter((a) => a.kind === "add_question" && questionOf(a));
  const others = actions.filter((a) => {
    if (a.kind === "add_question") return false;
    if (a.kind === "view_source") {
      const ref = a.payload?.sourceRef;
      // Already rendered with its quote above.
      return isSourceRef(ref) && !sourceRefs.some((r) => sameRef(r, ref));
    }
    return true;
  });
  if (questions.length === 0 && others.length === 0) return null;
  return (
    <div className="mt-3 flex flex-col gap-2">
      {questions.length > 0 && (
        <ul className="flex flex-col gap-2" aria-label={t("askKat.suggestedQuestion")}>
          {questions.map((a) => {
            const q = questionOf(a)!;
            const saved = savedQuestions.includes(q);
            return (
              <li key={q} className="rounded-2xl border border-dashed border-origin-ai/50 bg-origin-ai-soft p-2.5">
                <OriginBadge origin="ai_suggested" size="sm" label={t(originKey("ai_suggested"))} />
                <p className="mt-1.5 text-sm text-gray-90">{q}</p>
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-1.5"
                  disabled={saved}
                  leftIcon={
                    saved ? <CheckIcon aria-hidden="true" className="size-4" /> : <PlusIcon aria-hidden="true" className="size-4" />
                  }
                  onClick={() => onAction(a)}
                >
                  {saved ? t("askKat.questionAlreadySaved") : a.label || t("askKat.action.add_question")}
                </Button>
              </li>
            );
          })}
        </ul>
      )}
      {others.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {others.map((a, i) => {
            if (a.kind === "view_source") {
              const ref = a.payload?.sourceRef as SourceRef;
              return (
                <Button
                  key={`vs-${i}`}
                  variant="secondary"
                  size="sm"
                  disabled={!canViewSource(ref)}
                  leftIcon={<DocumentTextIcon aria-hidden="true" className="size-4" />}
                  onClick={() => onViewSource(ref)}
                >
                  {a.label || t("askKat.action.view_source")}
                </Button>
              );
            }
            return (
              <Button
                key={`${a.kind}-${i}`}
                variant="secondary"
                size="sm"
                rightIcon={<ArrowRightIcon aria-hidden="true" className="size-4" />}
                onClick={() => onAction(a)}
                data-action={a.kind}
              >
                {a.label || t(katActionKey(a.kind))}
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function KatMessage({ message, t, savedQuestions, canViewSource, onViewSource, onAction }: KatMessageProps) {
  if (message.role === "user") return <UserBubble message={message} t={t} />;
  if (message.safety?.level === "emergency") return <EmergencyMessage message={message} t={t} />;

  const welcome = isWelcomeMessage(message);
  const sourceRefs = (message.sourceRefs ?? []).filter(isSourceRef);
  const concerning = message.safety?.level === "concerning";
  return (
    <li className="flex items-start gap-2" data-role="assistant">
      <Avatar />
      <div
        className={cn(
          "min-w-0 max-w-[90%] flex-1 rounded-3xl rounded-tl-lg px-4 py-3",
          welcome ? "bg-accent-50" : "bg-gray-5",
        )}
      >
        <span className="sr-only">{t("askKat.kat")}: </span>
        {concerning && (
          <p className="mb-2 flex items-start gap-1.5 text-sm font-semibold text-warning-strong">
            <ExclamationTriangleIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            {t("safety.concerning.title")}
          </p>
        )}
        <p className="break-words whitespace-pre-line text-gray-90">{message.content}</p>
        <SourceRefs refs={sourceRefs} t={t} canViewSource={canViewSource} onViewSource={onViewSource} />
        <SourcesList ids={message.referenceIds ?? []} t={t} />
        <ActionsList
          actions={message.actions ?? []}
          sourceRefs={sourceRefs}
          t={t}
          savedQuestions={savedQuestions}
          canViewSource={canViewSource}
          onViewSource={onViewSource}
          onAction={onAction}
        />
        {message.meta && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <ModeBadge mode={message.meta.mode} model={message.meta.model} compact className="text-xs" />
            {message.meta.generatedBy === "deterministic" && (
              <span className="text-xs text-gray-70">{t("askKat.deterministicNote")}</span>
            )}
            {message.meta.disclaimer?.trim() && (
              <p className="w-full text-xs text-gray-70">{message.meta.disclaimer}</p>
            )}
          </div>
        )}
      </div>
    </li>
  );
}

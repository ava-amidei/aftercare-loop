"use client";
import { useRef, useState, type FormEvent } from "react";
import { MessageCircleQuestion, Search } from "lucide-react";
import {
  Alert,
  Button,
  Card,
  EmptyState,
  Input,
  LoadingRegion,
  ModeBadge,
  Skeleton,
  SkeletonText,
  useToast,
} from "@/components/ui";
import { useT } from "@/lib/i18n";
import { useActiveDocument, useDemoStore, useActiveSession } from "@/lib/store";
import type { KatResponse, SourceRef } from "@/lib/types";
import { askAboutTerm } from "./api";
import { isSavedQuestion } from "./result-model";
import { refMatchesDocument } from "./source-highlight";
import { SourceList } from "./SourceList";
import { useSourceViewer } from "./SourceViewer";

interface Entry {
  id: number;
  question: string;
  response: KatResponse;
}

const MAX_ENTRIES = 5;

/** "Ask about a term or condition": free text → /api/ask-kat → inline answer with references. */
export function AskTermPanel() {
  const t = useT();
  const { toast } = useToast();
  const session = useActiveSession();
  const document = useActiveDocument();
  const addSavedQuestion = useDemoStore((s) => s.addSavedQuestion);
  const viewer = useSourceViewer();
  const inputRef = useRef<HTMLInputElement>(null);
  const nextId = useRef(1);

  const [question, setQuestion] = useState("");
  const [validation, setValidation] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [lastAsked, setLastAsked] = useState("");
  const [entries, setEntries] = useState<Entry[]>([]);

  async function ask(text: string) {
    if (!session) return;
    const q = text.trim();
    if (!q) {
      setValidation(t("understand.topic.emptyQuestion"));
      inputRef.current?.focus();
      return;
    }
    setValidation(null);
    setLastAsked(q);
    setStatus("loading");
    try {
      const response = await askAboutTerm(session, q, document);
      setEntries((prev) => [{ id: nextId.current++, question: q, response }, ...prev].slice(0, MAX_ENTRIES));
      setStatus("idle");
      setQuestion("");
    } catch {
      setStatus("error");
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void ask(question);
  }

  function addQuestion(q: string) {
    if (!session) return;
    addSavedQuestion(session.profile.id, q);
    toast({ title: t("understand.discuss.addedToast"), variant: "success" });
  }

  const saved = session?.savedQuestions ?? [];

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <form onSubmit={onSubmit} className="flex flex-col gap-3" noValidate>
          <Input
            ref={inputRef}
            label={t("understand.input.topicLabel")}
            hint={t("understand.topic.hint")}
            placeholder={t("understand.input.topicPlaceholder")}
            value={question}
            maxLength={1000}
            onChange={(e) => setQuestion(e.target.value)}
            error={validation ?? undefined}
            autoComplete="off"
          />
          <div>
            <Button
              type="submit"
              loading={status === "loading"}
              loadingLabel={t("understand.topic.asking")}
              leftIcon={<Search aria-hidden="true" className="size-5" />}
            >
              {status === "loading" ? t("understand.topic.asking") : t("understand.topic.ask")}
            </Button>
          </div>
        </form>
      </Card>

      {status === "loading" && (
        <LoadingRegion label={t("understand.topic.asking")}>
          <Card>
            <Skeleton className="mb-3 h-5 w-1/3" />
            <SkeletonText lines={4} />
          </Card>
        </LoadingRegion>
      )}

      {status === "error" && (
        <Alert
          variant="danger"
          title={t("understand.topic.error")}
          action={
            <Button variant="secondary" size="sm" onClick={() => void ask(lastAsked)}>
              {t("understand.retry")}
            </Button>
          }
        >
          {t("common.errorDetail")}
        </Alert>
      )}

      {entries.length === 0 && status !== "loading" && status !== "error" && (
        <EmptyState
          icon={<MessageCircleQuestion aria-hidden="true" className="size-7" />}
          title={t("understand.tabs.topic")}
          description={t("understand.topic.empty")}
        />
      )}

      {entries.map((entry) => (
        <AnswerCard
          key={entry.id}
          entry={entry}
          saved={saved}
          onAddQuestion={addQuestion}
          onViewSource={(ref) => viewer.show(document, ref)}
          canViewSource={(ref) => refMatchesDocument(document, ref)}
        />
      ))}

      {viewer.element}
    </div>
  );
}

function AnswerCard({
  entry,
  saved,
  onAddQuestion,
  onViewSource,
  canViewSource,
}: {
  entry: Entry;
  saved: readonly string[];
  onAddQuestion: (q: string) => void;
  onViewSource: (ref: SourceRef) => void;
  canViewSource: (ref: SourceRef) => boolean;
}) {
  const t = useT();
  const { message, safety } = entry.response;
  const urgent = safety.level === "emergency" || safety.level === "concerning";
  const questionActions = (message.actions ?? []).filter(
    (a) => a.kind === "add_question" && typeof a.payload?.question === "string",
  );
  const sourceRefs = (message.sourceRefs ?? []).filter(canViewSource);

  return (
    <Card data-testid="term-answer">
      <article className="flex flex-col gap-3">
        <p className="text-sm text-ink-muted">
          {t("understand.topic.youAsked")}: <span className="font-medium text-ink">{entry.question}</span>
        </p>
        {urgent && safety.guidance && (
          <Alert variant={safety.level === "emergency" ? "danger" : "warning"} title={t("understand.safety.title")}>
            {safety.guidance}
          </Alert>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-semibold text-ink">{t("understand.topic.answerFromKat")}</h2>
          {message.meta && <ModeBadge mode={message.meta.mode} model={message.meta.model} compact />}
        </div>
        {message.content ? (
          <p className="text-base leading-relaxed whitespace-pre-line text-ink">{message.content}</p>
        ) : (
          <p className="text-base text-ink-muted">{t("understand.topic.error")}</p>
        )}
        {message.meta?.disclaimer && <p className="text-sm text-ink-muted">{message.meta.disclaimer}</p>}

        {sourceRefs.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {sourceRefs.map((ref, i) => (
              <Button key={`${ref.start}-${i}`} variant="secondary" size="sm" onClick={() => onViewSource(ref)}>
                {t("common.viewSource")}
              </Button>
            ))}
          </div>
        )}

        {questionActions.length > 0 && (
          <ul className="flex flex-col gap-2">
            {questionActions.map((a, i) => {
              const q = String(a.payload!.question);
              const done = isSavedQuestion(saved, q);
              return (
                <li key={i} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-base text-ink">{q}</span>
                  <Button variant="ghost" size="sm" disabled={done} onClick={() => onAddQuestion(q)}>
                    {done ? t("understand.discuss.added") : t("understand.topic.addQuestion")}
                  </Button>
                </li>
              );
            })}
          </ul>
        )}

        {!urgent && (
          <div className="flex flex-col gap-2 border-t border-border pt-3">
            <h3 className="text-base font-semibold text-ink">{t("understand.section.sources")}</h3>
            <SourceList referenceIds={message.referenceIds} />
          </div>
        )}
      </article>
    </Card>
  );
}

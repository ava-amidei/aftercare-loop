"use client";

import { useState } from "react";
import { ArrowRight, BookmarkCheck, BookmarkPlus, CircleCheck, RotateCcw, Sparkles } from "lucide-react";
import type {
  PatientProfile,
  SafetyVerdict,
  TeachBackQuestion,
  TeachBackSession,
  VisitDocument,
} from "@/lib/types";
import { Alert, Button, Card, ModeBadge, SourceQuote } from "@/components/ui";
import { useT } from "@/lib/i18n";
import { TeachBackAnswerForm } from "./TeachBackAnswerForm";
import {
  lastAttempt,
  latestClarification,
  postTeachBack,
  questionPhase,
  stripOpener,
} from "./teach-back-logic";

export interface TeachBackQuestionStepProps {
  question: TeachBackQuestion;
  profile: PatientProfile;
  document?: VisitDocument;
  session?: TeachBackSession;
  savedQuestions: string[];
  isLast: boolean;
  onSessionChange: (session: TeachBackSession) => void;
  onSaveQuestion: (question: TeachBackQuestion, session: TeachBackSession | undefined) => void;
  onNext: () => void;
  fetchImpl?: typeof fetch;
}

/** One teach-back question: answer → supportive feedback → re-explanation → retry. */
export function TeachBackQuestionStep({
  question,
  profile,
  document,
  session,
  savedQuestions,
  isLast,
  onSessionChange,
  onSaveQuestion,
  onNext,
  fetchImpl,
}: TeachBackQuestionStepProps) {
  const t = useT();
  const [submitting, setSubmitting] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<string | null>(null);
  const [safety, setSafety] = useState<SafetyVerdict | null>(null);

  const phase = questionPhase(session);
  const attempt = lastAttempt(session);
  const clarification = latestClarification(session);
  const saved = savedQuestions.includes(question.prompt.trim()) || !!session?.savedForClinician;
  const showForm = phase === "unanswered" || (phase === "clarified" && retrying);
  const opener = t("check.reexplain");

  const submit = async (response: string) => {
    setSubmitting(true);
    setError(null);
    setSafety(null);
    setLastResponse(response);
    try {
      const res = await postTeachBack(
        {
          patientId: profile.id,
          questionId: question.id,
          response,
          ...(session ? { session } : {}),
          language: profile.language,
          explanationLevel: profile.explanationLevel,
        },
        fetchImpl,
      );
      if (res.safety && res.safety.level !== "none") setSafety(res.safety);
      // An emergency response records no attempt; only persist real attempts.
      if (res.safety?.level !== "emergency") {
        onSessionChange(res.session);
        setRetrying(false);
      }
    } catch {
      setError(t("check.error"));
    } finally {
      setSubmitting(false);
    }
  };

  const nextLabel = isLast ? t("check.seeSummary") : t("check.nextQuestion");
  const saveButton = (
    <Button
      variant={saved ? "ghost" : "secondary"}
      disabled={saved}
      leftIcon={
        saved ? (
          <BookmarkCheck aria-hidden="true" className="size-5" />
        ) : (
          <BookmarkPlus aria-hidden="true" className="size-5" />
        )
      }
      onClick={() => onSaveQuestion(question, session)}
    >
      {saved ? t("check.saved") : t("check.saveForClinician")}
    </Button>
  );

  return (
    <Card padding="lg" className="flex flex-col gap-5" data-testid="teach-back-step" data-phase={phase}>
      <h2 className="text-xl leading-snug font-semibold text-ink sm:text-2xl">{question.prompt}</h2>

      {document && (
        <div className="flex flex-col gap-1.5">
          <p className="text-sm font-semibold tracking-wide text-ink-muted uppercase">{t("check.sourcePassage")}</p>
          <SourceQuote document={document} sourceRef={question.sourceRef} verification="verified" contextChars={80} />
        </div>
      )}

      {safety && safety.level === "emergency" && (
        <Alert variant="danger" title={t("safety.emergency.title")} live>
          <p>{safety.guidance ?? t("safety.emergency.call911")}</p>
          <p className="mt-1">{t("safety.emergency.dontWait")}</p>
        </Alert>
      )}
      {safety && safety.level === "concerning" && (
        <Alert variant="warning" title={t("safety.concerning.title")} live>
          <p>{safety.guidance ?? t("safety.concerning.body")}</p>
        </Alert>
      )}

      {attempt && !showForm && (
        <p className="text-base text-ink-muted">{t("check.yourAnswer", { answer: attempt.response })}</p>
      )}

      {phase === "correct" && (
        <Alert
          variant="success"
          live
          icon={<CircleCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-success" />}
          title={(session?.attempts.length ?? 0) > 1 ? t("check.result.correctAfterRetry") : t("check.result.correct")}
        >
          {(session?.attempts.length ?? 0) > 1 ? t("check.encourage") : `${t("check.result.correctDetail")} ${t("check.encourage")}`}
        </Alert>
      )}

      {(phase === "clarified" || phase === "unresolved") && clarification && !showForm && (
        <section
          aria-labelledby={`clarify-${question.id}`}
          data-testid="clarification"
          className="flex flex-col gap-3 rounded-card border border-accent-200 bg-accent-50 p-4"
        >
          <p className="text-base text-ink">{t("check.result.notYet")}</p>
          <h3 id={`clarify-${question.id}`} className="flex items-center gap-2 text-lg font-semibold text-ink">
            <Sparkles aria-hidden="true" className="size-5 text-accent-700" />
            {opener}
          </h3>
          <p className="text-base leading-relaxed whitespace-pre-line text-ink">
            {stripOpener(clarification.text, opener)}
          </p>
          {clarification.mode && <ModeBadge mode={clarification.mode} compact />}
        </section>
      )}

      {phase === "unresolved" && (
        <Alert variant="info" title={t("check.unresolved.title")}>
          {t("check.unresolved.body")}
        </Alert>
      )}

      {error && (
        <Alert
          variant="danger"
          title={error}
          action={
            lastResponse ? (
              <Button size="sm" variant="secondary" onClick={() => submit(lastResponse)} loading={submitting}>
                {t("common.retry")}
              </Button>
            ) : undefined
          }
        >
          {t("common.errorDetail")}
        </Alert>
      )}

      {showForm && (
        <TeachBackAnswerForm
          key={`${question.id}-${session?.attempts.length ?? 0}`}
          question={question}
          submitting={submitting}
          onSubmit={submit}
        />
      )}

      <div className="flex flex-wrap gap-3">
        {phase === "clarified" && !retrying && (
          <Button onClick={() => setRetrying(true)} leftIcon={<RotateCcw aria-hidden="true" className="size-5" />}>
            {t("check.tryAgain")}
          </Button>
        )}
        {(phase === "correct" || phase === "unresolved") && (
          <Button onClick={onNext} rightIcon={<ArrowRight aria-hidden="true" className="size-5" />}>
            {nextLabel}
          </Button>
        )}
        {phase !== "correct" && saveButton}
        {(phase === "unanswered" || phase === "clarified") && (
          <Button variant="ghost" onClick={onNext}>
            {isLast ? t("check.seeSummary") : t("check.skip")}
          </Button>
        )}
      </div>
    </Card>
  );
}

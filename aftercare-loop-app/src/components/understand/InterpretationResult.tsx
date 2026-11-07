"use client";
import { useId, useState, type ReactNode } from "react";
import {
  BookOpen,
  ChevronDown,
  CircleHelp,
  Footprints,
  GraduationCap,
  Library,
  MessageSquarePlus,
  Check,
  TriangleAlert,
} from "lucide-react";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ModeBadge,
  OriginBadge,
  type AlertVariant,
} from "@/components/ui";
import { actionTypeKey, originKey, useT } from "@/lib/i18n";
import type {
  DocumentInterpretation,
  ExtractedInstruction,
  SafetyFlag,
  SourceRef,
  TermDefinition,
  VisitDocument,
} from "@/lib/types";
import { cn } from "@/lib/utils/cn";
import { formatDate } from "@/lib/utils/dates";
import { refMatchesDocument } from "./source-highlight";
import { SourceList } from "./SourceList";
import {
  collectReferenceIds,
  discussionItems,
  isSavedQuestion,
  partitionInstructions,
  sortSafetyFlags,
} from "./result-model";

export interface InterpretationResultProps {
  interpretation: DocumentInterpretation;
  document: VisitDocument;
  savedQuestions: readonly string[];
  onAddQuestion: (question: string) => void;
  onViewSource: (ref: SourceRef, label?: ReactNode) => void;
}

function SectionCard({
  icon,
  title,
  description,
  badge,
  children,
  testId,
}: {
  icon: ReactNode;
  title: string;
  description?: ReactNode;
  badge?: ReactNode;
  children: ReactNode;
  testId: string;
}) {
  const headingId = useId();
  return (
    <section aria-labelledby={headingId} data-testid={testId}>
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-control bg-brand-50 text-brand-700">
              {icon}
            </span>
            <CardTitle id={headingId} as="h2" className="min-w-0 flex-1">
              {title}
            </CardTitle>
            {badge}
          </div>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </section>
  );
}

const FLAG_VARIANT: Record<SafetyFlag["level"], AlertVariant> = {
  urgent: "danger",
  clarify_with_clinician: "warning",
  info: "info",
};

export function SafetyFlagsBanner({ flags }: { flags: SafetyFlag[] }) {
  const t = useT();
  if (flags.length === 0) return null;
  const sorted = sortSafetyFlags(flags);
  const levelLabel = (l: SafetyFlag["level"]) =>
    l === "urgent"
      ? t("understand.safety.urgent")
      : l === "clarify_with_clinician"
        ? t("understand.safety.clarify")
        : t("understand.safety.info");
  return (
    <div className="flex flex-col gap-3" data-testid="safety-flags">
      {sorted.map((flag, i) => (
        <Alert key={`${flag.level}-${i}`} variant={FLAG_VARIANT[flag.level]} title={levelLabel(flag.level)} live={flag.level === "urgent"}>
          {flag.message}
        </Alert>
      ))}
    </div>
  );
}

function TermItem({
  term,
  document,
  onViewSource,
}: {
  term: TermDefinition;
  document: VisitDocument;
  onViewSource: InterpretationResultProps["onViewSource"];
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const sourceOk = refMatchesDocument(document, term.sourceRef);
  return (
    <li className="rounded-control border border-border">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
        className="flex min-h-11 w-full items-center justify-between gap-3 rounded-control px-3 py-2 text-left text-base font-semibold text-ink hover:bg-surface-muted"
      >
        <span>{term.term}</span>
        <ChevronDown aria-hidden="true" className={cn("size-5 shrink-0 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div id={panelId} className="flex flex-col gap-2 border-t border-border px-3 py-3">
          <p className="text-base text-ink">{term.definition}</p>
          {term.sourceRef &&
            (sourceOk ? (
              <div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onViewSource(term.sourceRef!, term.term)}
                  className="px-1 text-brand-800 underline underline-offset-4"
                >
                  {t("common.viewSource")}
                </Button>
              </div>
            ) : (
              <p className="text-sm text-ink-muted">{t("understand.terms.notInDocument")}</p>
            ))}
        </div>
      )}
    </li>
  );
}

function QuestionRow({
  question,
  saved,
  onAdd,
}: {
  question: string;
  saved: boolean;
  onAdd: (q: string) => void;
}) {
  const t = useT();
  return (
    <li className="flex flex-col gap-2 rounded-control border border-border p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-col gap-1.5">
        <OriginBadge origin="ai_suggested" size="sm" label={t(originKey("ai_suggested"))} className="self-start" />
        <p className="text-base text-ink">{question}</p>
      </div>
      <Button
        variant={saved ? "ghost" : "secondary"}
        size="sm"
        disabled={saved}
        onClick={() => onAdd(question)}
        leftIcon={
          saved ? <Check aria-hidden="true" className="size-4" /> : <MessageSquarePlus aria-hidden="true" className="size-4" />
        }
        className="shrink-0"
        aria-label={saved ? `${t("understand.discuss.added")}: ${question}` : `${t("understand.addQuestion")}: ${question}`}
      >
        {saved ? t("understand.discuss.added") : t("understand.addQuestion")}
      </Button>
    </li>
  );
}

function InstructionRow({
  instruction,
  onViewSource,
}: {
  instruction: ExtractedInstruction;
  onViewSource: InterpretationResultProps["onViewSource"];
}) {
  const t = useT();
  return (
    <li className="flex flex-col gap-2 rounded-control border border-border p-3" data-testid="verified-instruction">
      <div className="flex flex-wrap items-center gap-2">
        <OriginBadge origin="clinician_documented" size="sm" label={t(originKey("clinician_documented"))} />
        <Badge size="sm">{t(actionTypeKey(instruction.type))}</Badge>
        {instruction.dueDate && (
          <Badge size="sm" variant="brand">
            {t("common.dueDate", { date: formatDate(instruction.dueDate, t.lang) || instruction.dueDate })}
          </Badge>
        )}
      </div>
      <p className="text-base font-medium text-ink">{instruction.description}</p>
      <p className="text-sm text-ink-muted">“{instruction.sourceRef!.quote}”</p>
      <div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onViewSource(instruction.sourceRef!, instruction.description)}
          aria-label={`${t("common.viewSource")}: ${instruction.description}`}
        >
          {t("common.viewSource")}
        </Button>
      </div>
    </li>
  );
}

export function InterpretationResult({
  interpretation,
  document,
  savedQuestions,
  onAddQuestion,
  onViewSource,
}: InterpretationResultProps) {
  const t = useT();
  const { verified, needsClarification } = partitionInstructions(interpretation.instructions, document);
  const { suggested, unanswered } = discussionItems(interpretation);
  const referenceIds = collectReferenceIds(interpretation);

  return (
    <div className="flex flex-col gap-4" data-testid="interpretation-result">
      <div className="flex flex-col gap-2">
        <p className="text-sm text-ink-muted">{t("understand.resultFor", { title: document.title })}</p>
        <ModeBadge mode={interpretation.meta.mode} model={interpretation.meta.model} className="self-start" />
        {interpretation.meta.disclaimer && <p className="text-sm text-ink-muted">{interpretation.meta.disclaimer}</p>}
      </div>

      <SafetyFlagsBanner flags={interpretation.safetyFlags} />

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard
          testId="card-what-this-means"
          icon={<BookOpen aria-hidden="true" className="size-5" />}
          title={t("understand.section.whatThisMeans")}
        >
          <p className="text-base leading-relaxed whitespace-pre-line text-ink">{interpretation.whatThisMeans}</p>
          {interpretation.terms.length > 0 && (
            <div className="flex flex-col gap-2">
              <h3 className="text-base font-semibold text-ink">{t("understand.section.terms")}</h3>
              <p className="text-sm text-ink-muted">{t("understand.terms.expandHint")}</p>
              <ul className="flex flex-col gap-2">
                {interpretation.terms.map((term, i) => (
                  <TermItem key={`${term.term}-${i}`} term={term} document={document} onViewSource={onViewSource} />
                ))}
              </ul>
            </div>
          )}
          {interpretation.limitations.length > 0 && (
            <div className="flex flex-col gap-2">
              <h3 className="text-base font-semibold text-ink">{t("understand.section.limitations")}</h3>
              <ul className="list-disc space-y-1 pl-5 text-base text-ink">
                {interpretation.limitations.map((l, i) => (
                  <li key={i}>{l}</li>
                ))}
              </ul>
            </div>
          )}
        </SectionCard>

        <SectionCard
          testId="card-what-to-know"
          icon={<GraduationCap aria-hidden="true" className="size-5" />}
          title={t("understand.section.whatToKnow")}
          badge={<Badge variant="info">{t("understand.label.generalEducation")}</Badge>}
          description={t("understand.whatToKnow.generalNote")}
        >
          {interpretation.whatToKnow.length > 0 ? (
            <ul className="list-disc space-y-2 pl-5 text-base text-ink">
              {interpretation.whatToKnow.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          ) : (
            <p className="text-base text-ink-muted">{t("understand.whatToKnow.empty")}</p>
          )}
        </SectionCard>

        <SectionCard
          testId="card-discuss"
          icon={<CircleHelp aria-hidden="true" className="size-5" />}
          title={t("understand.section.discuss")}
          description={t("understand.discuss.hint")}
        >
          {suggested.length === 0 && unanswered.length === 0 ? (
            <p className="text-base text-ink-muted">{t("understand.discuss.empty")}</p>
          ) : (
            <>
              {suggested.length > 0 && (
                <ul className="flex flex-col gap-2">
                  {suggested.map((q) => (
                    <QuestionRow key={q} question={q} saved={isSavedQuestion(savedQuestions, q)} onAdd={onAddQuestion} />
                  ))}
                </ul>
              )}
              {unanswered.length > 0 && (
                <div className="flex flex-col gap-2">
                  <h3 className="text-base font-semibold text-ink">{t("understand.section.unanswered")}</h3>
                  <ul className="flex flex-col gap-2">
                    {unanswered.map((q) => (
                      <QuestionRow key={q} question={q} saved={isSavedQuestion(savedQuestions, q)} onAdd={onAddQuestion} />
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </SectionCard>

        <SectionCard
          testId="card-next-steps"
          icon={<Footprints aria-hidden="true" className="size-5" />}
          title={t("understand.section.nextSteps")}
          description={t("understand.nextSteps.hint")}
        >
          {verified.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {verified.map((ins, i) => (
                <InstructionRow key={`${ins.sourceRef?.start}-${i}`} instruction={ins} onViewSource={onViewSource} />
              ))}
            </ul>
          ) : (
            <p className="text-base text-ink-muted">{t("understand.noInstructions")}</p>
          )}
          {needsClarification.length > 0 && (
            <div
              className="flex flex-col gap-2 rounded-control border border-dashed border-warning/60 bg-warning-soft p-3"
              data-testid="needs-clarification"
              role="group"
              aria-label={t("understand.nextSteps.needsClarification")}
            >
              <h3 className="inline-flex items-center gap-2 text-base font-semibold text-warning-strong">
                <TriangleAlert aria-hidden="true" className="size-5" />
                {t("understand.nextSteps.needsClarification")}
              </h3>
              <p className="text-sm text-ink">{t("understand.nextSteps.needsClarificationHint")}</p>
              <ul className="flex flex-col gap-2">
                {needsClarification.map((ins, i) => (
                  <li key={i} className="rounded-control border border-warning/40 bg-surface p-3">
                    <Badge variant="warning" size="sm" className="mb-1">
                      {t("understand.nextSteps.notVerified")}
                    </Badge>
                    <p className="text-base text-ink">{ins.description}</p>
                    {(ins.unverifiedQuote ?? ins.sourceRef?.quote) && (
                      <p className="mt-1 text-sm text-ink-muted">
                        {t("understand.nextSteps.claimedQuote", {
                          quote: (ins.unverifiedQuote ?? ins.sourceRef?.quote ?? "").slice(0, 300),
                        })}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </SectionCard>
      </div>

      <SectionCard
        testId="card-sources"
        icon={<Library aria-hidden="true" className="size-5" />}
        title={t("understand.section.sources")}
      >
        <SourceList referenceIds={referenceIds} />
      </SectionCard>
    </div>
  );
}

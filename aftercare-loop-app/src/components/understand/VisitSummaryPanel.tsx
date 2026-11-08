"use client";
import { useRef, useState, type ChangeEvent, type ReactNode } from "react";
import { SparklesIcon } from "@heroicons/react/24/outline";
import { DocumentArrowUpIcon, DocumentTextIcon, SparklesIcon as SparklesMiniIcon } from "@heroicons/react/20/solid";
import {
  Alert,
  Button,
  Card,
  EmptyState,
  LoadingRegion,
  Skeleton,
  SkeletonText,
  Textarea,
  useToast,
} from "@/components/ui";
import { useT } from "@/lib/i18n";
import { useActiveDocument, useActiveInterpretation, useActiveSession, useDemoStore } from "@/lib/store";
import type { SourceRef } from "@/lib/types";
import { requestInterpretation } from "./api";
import { CtaRow } from "./CtaRow";
import { MAX_SUMMARY_CHARS, readFileAsText, validateSummaryText, validateTextFile } from "./file-input";
import { InterpretationResult } from "./InterpretationResult";
import { useSourceViewer } from "./SourceViewer";

type Status = "idle" | "loading" | "error";

/** "My visit summary": paste / sample / .txt upload → /api/interpret → five-card explanation. */
export function VisitSummaryPanel() {
  const t = useT();
  const { toast } = useToast();
  const session = useActiveSession();
  const activeDocument = useActiveDocument();
  const interpretation = useActiveInterpretation();
  const addDocument = useDemoStore((s) => s.addDocument);
  const setActiveDocument = useDemoStore((s) => s.setActiveDocument);
  const setInterpretation = useDemoStore((s) => s.setInterpretation);
  const addSavedQuestion = useDemoStore((s) => s.addSavedQuestion);
  const viewer = useSourceViewer();
  const fileRef = useRef<HTMLInputElement>(null);

  const [text, setText] = useState(activeDocument?.text ?? "");
  const [origin, setOrigin] = useState<"pasted" | "uploaded_txt">("pasted");
  const [uploadTitle, setUploadTitle] = useState<string | undefined>();
  const [inputError, setInputError] = useState<string | null>(null);
  const [fileNotice, setFileNotice] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");

  const sampleDocument = session?.documents.find((d) => d.source === "fixture");
  const patientId = session?.profile.id;

  function setTextFrom(value: string, from: "pasted" | "uploaded_txt", title?: string) {
    setText(value);
    setOrigin(from);
    setUploadTitle(title);
    setInputError(null);
  }

  function loadSample() {
    if (!sampleDocument) return;
    setTextFrom(sampleDocument.text, "pasted");
    setFileNotice(null);
  }

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;
    setFileNotice(null);
    const problem = validateTextFile(file);
    if (problem) {
      setInputError(
        problem === "wrong_type"
          ? t("understand.input.fileWrongType")
          : problem === "too_large"
            ? t("understand.input.fileTooLarge")
            : t("understand.input.fileEmpty"),
      );
      return;
    }
    try {
      const content = await readFileAsText(file);
      if (content.length > MAX_SUMMARY_CHARS) {
        setInputError(t("understand.input.tooLong", { max: MAX_SUMMARY_CHARS.toLocaleString(t.lang) }));
        return;
      }
      if (!content.trim()) {
        setInputError(t("understand.input.fileEmpty"));
        return;
      }
      setTextFrom(content, "uploaded_txt", file.name.replace(/\.txt$/i, "").slice(0, 200));
      setFileNotice(t("understand.input.fileLoaded", { name: file.name }));
    } catch {
      setInputError(t("understand.input.fileReadError"));
    }
  }

  async function explain() {
    if (!patientId) return;
    const problem = validateSummaryText(text);
    if (problem) {
      setInputError(
        problem === "empty"
          ? t("understand.input.emptyDocument")
          : t("understand.input.tooLong", { max: MAX_SUMMARY_CHARS.toLocaleString(t.lang) }),
      );
      return;
    }
    setInputError(null);
    setStatus("loading");
    try {
      const result = await requestInterpretation({
        patientId,
        text,
        baseDocument: activeDocument,
        origin,
        title: uploadTitle,
      });
      addDocument(patientId, result.document);
      setActiveDocument(patientId, result.document.id);
      setInterpretation(patientId, result.interpretation);
      // Keep the editor in sync with the stored (sanitized) text so offsets match what is shown.
      setText(result.document.text);
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  }

  function addQuestion(q: string) {
    if (!patientId) return;
    addSavedQuestion(patientId, q);
    toast({ title: t("understand.discuss.addedToast"), variant: "success" });
  }

  function viewSource(ref: SourceRef, label?: ReactNode) {
    viewer.show(activeDocument, ref, label);
  }

  const showResult = status === "idle" && interpretation && activeDocument && interpretation.documentId === activeDocument.id;

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <div className="flex flex-col gap-3">
          <Textarea
            label={t("understand.input.documentLabel")}
            hint={t("understand.input.pasteHint")}
            placeholder={t("understand.input.documentPlaceholder")}
            value={text}
            rows={10}
            onChange={(e) => setTextFrom(e.target.value, "pasted", undefined)}
            onPaste={() => setFileNotice(null)}
            error={inputError ?? undefined}
            className="font-sans text-base"
          />
          <p className="text-sm text-gray-70" aria-live="polite">
            {t("understand.input.charCount", {
              count: text.length.toLocaleString(t.lang),
              max: MAX_SUMMARY_CHARS.toLocaleString(t.lang),
            })}
            {fileNotice && <span className="ml-2 font-medium text-success-strong">· {fileNotice}</span>}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <Button
              size="lg"
              onClick={() => void explain()}
              loading={status === "loading"}
              loadingLabel={t("understand.generating")}
              leftIcon={<SparklesMiniIcon aria-hidden="true" className="size-5" />}
            >
              {status === "loading" ? t("understand.generating") : t("understand.explain")}
            </Button>
            {sampleDocument && (
              <Button
                variant="secondary"
                onClick={loadSample}
                leftIcon={<DocumentTextIcon aria-hidden="true" className="size-5" />}
                disabled={status === "loading"}
              >
                {t("understand.input.loadSample")}
              </Button>
            )}
            <Button
              variant="secondary"
              onClick={() => fileRef.current?.click()}
              leftIcon={<DocumentArrowUpIcon aria-hidden="true" className="size-5" />}
              disabled={status === "loading"}
              aria-describedby="understand-upload-hint"
            >
              {t("understand.input.upload")}
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".txt,text/plain"
              className="sr-only"
              tabIndex={-1}
              aria-hidden="true"
              data-testid="summary-file-input"
              onChange={(e) => void onFile(e)}
            />
          </div>
          <p id="understand-upload-hint" className="text-sm text-gray-70">
            {t("understand.input.uploadHint")}
          </p>
        </div>
      </Card>

      {status === "loading" && <ResultSkeleton label={t("understand.generating")} />}

      {status === "error" && (
        <Alert
          variant="danger"
          title={t("understand.error")}
          action={
            <Button variant="secondary" size="sm" onClick={() => void explain()}>
              {t("understand.retry")}
            </Button>
          }
        >
          {t("common.errorDetail")}
        </Alert>
      )}

      {showResult && session && (
        <>
          <InterpretationResult
            interpretation={interpretation}
            document={activeDocument}
            savedQuestions={session.savedQuestions}
            onAddQuestion={addQuestion}
            onViewSource={viewSource}
          />
          <CtaRow session={session} document={activeDocument} interpretation={interpretation} />
        </>
      )}

      {status === "idle" && !showResult && (
        <EmptyState
          icon={<SparklesIcon aria-hidden="true" className="size-7" />}
          title={t("understand.tabs.summary")}
          description={t("understand.emptyResult")}
        />
      )}

      {viewer.element}
    </div>
  );
}

export function ResultSkeleton({ label }: { label: string }) {
  return (
    <LoadingRegion label={label} className="grid gap-4 lg:grid-cols-2">
      {Array.from({ length: 4 }, (_, i) => (
        <Card key={i}>
          <Skeleton className="mb-4 h-6 w-1/2" />
          <SkeletonText lines={4} />
        </Card>
      ))}
    </LoadingRegion>
  );
}

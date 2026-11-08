"use client";
import { useState, type FormEvent } from "react";
import { PaperAirplaneIcon } from "@heroicons/react/20/solid";
import type { ActionItem, CareTeamRequestType, PatientProfile, SafetyVerdict } from "@/lib/types";
import {
  Alert,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Select,
  Textarea,
  useToast,
} from "@/components/ui";
import { careTeamTypeKey, useT } from "@/lib/i18n";
import { evaluateSafety } from "@/lib/safety/rules";
import { safetyContextOf } from "@/lib/safety/context";
import { useDemoStore } from "@/lib/store";
import { normalizeWhitespace, truncate } from "@/lib/utils/text";
import { PATIENT_REQUEST_TYPES, buildFormRequest } from "./follow-up-helpers";
import { SafetyNotice } from "./SafetyNotice";

export interface CareTeamRequestFormProps {
  profile: PatientProfile;
  actions: ActionItem[];
}

/** Small form that adds a fictional request to the simulated care-team queue. */
export function CareTeamRequestForm({ profile, actions }: CareTeamRequestFormProps) {
  const t = useT();
  const { toast } = useToast();
  const addCareTeamRequest = useDemoStore((s) => s.addCareTeamRequest);
  const [type, setType] = useState<CareTeamRequestType>("clarification");
  const [summary, setSummary] = useState("");
  const [relatedActionId, setRelatedActionId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const [verdict, setVerdict] = useState<SafetyVerdict | null>(null);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const req = buildFormRequest({ patientId: profile.id, type, summary, relatedActionId });
    if (!req) {
      setError(t("followUp.request.summaryRequired"));
      setAdded(false);
      return;
    }
    // Deterministic safety rules run on every user message (ARCHITECTURE §2.6).
    setVerdict(
      evaluateSafety(summary, {
        language: profile.language,
        ...safetyContextOf(profile),
      }),
    );
    addCareTeamRequest(profile.id, req);
    setError(null);
    setSummary("");
    setRelatedActionId("");
    setAdded(true);
    toast({ title: t("followUp.request.added"), variant: "success" });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("followUp.request.title")}</CardTitle>
        <CardDescription>{t("followUp.request.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4" aria-label={t("followUp.request.title")}>
          <Select
            label={t("followUp.request.type")}
            value={type}
            onChange={(e) => setType(e.target.value as CareTeamRequestType)}
            options={PATIENT_REQUEST_TYPES.map((v) => ({ value: v, label: t(careTeamTypeKey(v)) }))}
          />
          {type === "refill_request" && <Alert variant="info">{t("followUp.request.refillNote")}</Alert>}
          <Textarea
            label={t("followUp.request.summary")}
            hint={t("followUp.request.summaryHint")}
            error={error ?? undefined}
            required
            rows={3}
            value={summary}
            onChange={(e) => {
              setSummary(e.target.value);
              if (error) setError(null);
            }}
          />
          <Select
            label={t("followUp.request.relatedAction")}
            value={relatedActionId}
            onChange={(e) => setRelatedActionId(e.target.value)}
            options={[
              { value: "", label: t("followUp.request.relatedNone") },
              ...actions.map((a) => ({ value: a.id, label: truncate(normalizeWhitespace(a.description), 80) })),
            ]}
          />
          <p className="text-sm font-semibold text-warning-strong">{t("followUp.simulation.label")}</p>
          <Button type="submit" leftIcon={<PaperAirplaneIcon aria-hidden="true" className="size-5" />} className="self-start">
            {t("followUp.request.submit")}
          </Button>
          <SafetyNotice verdict={verdict} />
          {added && (
            <Alert variant="success" live title={t("followUp.simulation.label")}>
              {t("followUp.request.added")}
            </Alert>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

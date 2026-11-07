"use client";

import { useEffect, useId, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { RotateCcw, Save, UserRound, X, Plus } from "lucide-react";
import {
  Button,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  EmptyState,
  Input,
  LoadingRegion,
  PageHeader,
  Select,
  Skeleton,
  Textarea,
  useToast,
} from "@/components/ui";
import { getPatient } from "@/data/patients";
import {
  accessibilityKey,
  barrierKey,
  explanationLevelHintKey,
  explanationLevelKey,
  languageNameKey,
  useT,
} from "@/lib/i18n";
import { useActivePatient, useDemoStore, useHasHydrated, usePatientProfiles } from "@/lib/store";
import type { PatientProfile } from "@/lib/types";
import { ConditionChips } from "./ConditionChips";
import { MedicationListEditor } from "./MedicationListEditor";
import {
  ACCESS_BARRIERS,
  ACCESSIBILITY_PREFERENCES,
  AGE_RANGES,
  EXPLANATION_LEVELS,
  LANGUAGES,
  applyAccessibilityPrefs,
  buildConditionOptions,
  draftFromProfile,
  draftToPatch,
  isDraftDirty,
  rebaseDraft,
  textItemOrigin,
  toggleValue,
  type ProfileDraft,
} from "./profile-draft";
import { ProfileOriginBadge } from "./ProfileOriginBadge";
import { SegmentedControl } from "./SegmentedControl";
import { TextListEditor } from "./TextListEditor";
import { useApplyAccessibilityPrefs } from "./use-accessibility-prefs";

/**
 * My Health Profile (SPEC §3B). One component for every fictional patient:
 * the profile's data drives the UI; nothing branches on a condition or id.
 */
export function ProfileEditor() {
  const t = useT();
  const hydrated = useHasHydrated();
  const profile = useActivePatient();

  if (!hydrated) {
    return (
      <>
        <PageHeader title={t("profile.title")} description={t("profile.subtitle")} />
        <LoadingRegion label={t("profile.loading")} className="flex flex-col gap-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-40 w-full rounded-card" />
          ))}
        </LoadingRegion>
      </>
    );
  }

  if (!profile) {
    return (
      <>
        <PageHeader title={t("profile.title")} />
        <EmptyState
          icon={<UserRound aria-hidden="true" className="size-7" />}
          title={t("profile.error.title")}
          description={t("profile.error.detail")}
        />
      </>
    );
  }

  // Remount per patient: drafts never leak between fictional patients.
  return <ProfileForm key={profile.id} profile={profile} />;
}

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  const headingId = useId();
  return (
    <section aria-labelledby={headingId}>
      <Card className="flex flex-col gap-5">
        <CardHeader className="mb-0">
          <CardTitle as="h2" id={headingId}>
            {title}
          </CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        {children}
      </Card>
    </section>
  );
}

export function ProfileForm({ profile }: { profile: PatientProfile }) {
  const t = useT();
  const { toast } = useToast();
  const updateProfile = useDemoStore((s) => s.updateProfile);
  const allProfiles = usePatientProfiles();

  const [base, setBase] = useState(profile);
  const [draft, setDraft] = useState<ProfileDraft>(() => draftFromProfile(profile));

  // Stored profile changed underneath us (hydration, header language toggle):
  // untouched fields follow it, edited fields keep the user's edit.
  if (profile !== base) {
    setBase(profile);
    setDraft((d) => rebaseDraft(base, profile, d));
  }

  const documented = useMemo(() => getPatient(profile.id), [profile.id]);
  const dirty = isDraftDirty(draft, profile);
  const conditionOptions = useMemo(
    () => buildConditionOptions(draft.conditions, allProfiles, draft.language),
    [draft.conditions, allProfiles, draft.language],
  );

  // Live preview of accessibility prefs; on leave, restore the SAVED prefs.
  useApplyAccessibilityPrefs(draft.accessibility);
  useEffect(
    () => () => {
      const s = useDemoStore.getState();
      applyAccessibilityPrefs(s.patients[s.activePatientId]?.profile.accessibility ?? []);
    },
    [],
  );

  const set = <K extends keyof ProfileDraft>(key: K, value: ProfileDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const save = (e?: FormEvent) => {
    e?.preventDefault();
    const patch = draftToPatch(draft);
    updateProfile(profile.id, patch);
    const saved = useDemoStore.getState().patients[profile.id]?.profile ?? { ...profile, ...patch };
    setBase(saved);
    setDraft(draftFromProfile(saved));
    toast({ title: t("profile.saved"), description: t("profile.savedDetail"), variant: "success" });
  };

  const discard = () => {
    setDraft(draftFromProfile(profile));
    toast({ title: t("profile.discarded"), variant: "info" });
  };

  const actions = (
    <>
      <Button type="submit" form="profile-form" disabled={!dirty} leftIcon={<Save aria-hidden="true" className="size-5" />}>
        {t("profile.save")}
      </Button>
      <Button
        variant="secondary"
        onClick={discard}
        disabled={!dirty}
        leftIcon={<RotateCcw aria-hidden="true" className="size-5" />}
      >
        {t("profile.discard")}
      </Button>
    </>
  );

  const ageOptions = AGE_RANGES.includes(draft.ageRange) || !draft.ageRange ? AGE_RANGES : [draft.ageRange, ...AGE_RANGES];
  const pregnancyOptedIn = draft.pregnancyOrPostpartumContext !== undefined;
  const documentedPregnancy = documented?.pregnancyOrPostpartumContext
    ? [documented.pregnancyOrPostpartumContext]
    : undefined;

  return (
    <>
      <PageHeader
        title={t("profile.title")}
        description={t("profile.subtitle")}
        icon={<UserRound aria-hidden="true" className="size-6" />}
        actions={actions}
      />

      <p role="status" className="mb-4 text-sm font-medium text-ink-muted" data-testid="profile-dirty-status">
        {dirty ? t("profile.unsaved") : t("profile.upToDate")}
      </p>

      <form id="profile-form" aria-label={t("profile.form.label")} onSubmit={save} className="flex flex-col gap-5">
        <Section title={t("profile.section.about")} description={t("profile.privacyNote")}>
          {profile.scenarioSummary && (
            <p className="text-sm text-ink-muted">{t("profile.scenario", { summary: profile.scenarioSummary })}</p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label={t("profile.field.displayName")}
              value={draft.displayName}
              onChange={(e) => set("displayName", e.target.value)}
              autoComplete="off"
            />
            <Select
              label={t("profile.field.ageRange")}
              value={draft.ageRange}
              onChange={(e) => set("ageRange", e.target.value)}
              placeholder={t("profile.field.ageRangePlaceholder")}
              options={ageOptions.map((a) => ({ value: a, label: a }))}
            />
          </div>
        </Section>

        <Section title={t("profile.section.preferences")}>
          <Select
            label={t("profile.field.language")}
            hint={t("profile.field.languageHint")}
            value={draft.language}
            onChange={(e) => set("language", e.target.value as ProfileDraft["language"])}
            options={LANGUAGES.map((l) => ({ value: l, label: t(languageNameKey(l)) }))}
          />
          <SegmentedControl
            legend={t("profile.field.explanationLevel")}
            value={draft.explanationLevel}
            onChange={(v) => set("explanationLevel", v)}
            options={EXPLANATION_LEVELS.map((lvl) => ({
              value: lvl,
              label: t(explanationLevelKey(lvl)),
              hint: t(explanationLevelHintKey(lvl)),
            }))}
          />
          <fieldset className="flex flex-col">
            <legend className="mb-1 text-base font-medium text-ink">{t("profile.field.accessibility")}</legend>
            <p className="mb-1 text-sm text-ink-muted">{t("profile.field.accessibilityHint")}</p>
            <div className="grid sm:grid-cols-2">
              {ACCESSIBILITY_PREFERENCES.map((pref) => (
                <Checkbox
                  key={pref}
                  label={t(accessibilityKey(pref))}
                  checked={draft.accessibility.includes(pref)}
                  onChange={() => set("accessibility", toggleValue(draft.accessibility, pref))}
                />
              ))}
            </div>
          </fieldset>
        </Section>

        <Section title={t("profile.section.health")}>
          <ConditionChips
            selected={draft.conditions}
            options={conditionOptions}
            onChange={(v) => set("conditions", v)}
          />
          <MedicationListEditor
            medications={draft.medications}
            onChange={(v) => set("medications", v)}
            documented={documented?.medications}
          />
          <TextListEditor
            label={t("profile.field.careInstructions")}
            hint={t("profile.careInstructions.hint")}
            items={draft.careInstructions}
            onChange={(v) => set("careInstructions", v)}
            addLabel={t("profile.careInstructions.addLabel")}
            placeholder={t("profile.careInstructions.placeholder")}
            emptyText={t("profile.careInstructions.empty")}
            originFor={(item) => textItemOrigin(item, documented?.careInstructions)}
          />
          <TextListEditor
            label={t("profile.field.healthGoals")}
            items={draft.healthGoals}
            onChange={(v) => set("healthGoals", v)}
            addLabel={t("profile.healthGoals.addLabel")}
            placeholder={t("profile.field.healthGoalsPlaceholder")}
            emptyText={t("profile.healthGoals.empty")}
            originFor={() => "patient_selected"}
            patientWording="chosen"
          />
          <div className="flex flex-col gap-3" data-testid="pregnancy-context">
            {pregnancyOptedIn ? (
              <>
                <ProfileOriginBadge
                  origin={textItemOrigin(draft.pregnancyOrPostpartumContext ?? "", documentedPregnancy)}
                  className="self-start"
                />
                <Textarea
                  label={t("profile.field.pregnancy")}
                  hint={t("profile.field.pregnancyHint")}
                  rows={3}
                  value={draft.pregnancyOrPostpartumContext ?? ""}
                  placeholder={t("profile.pregnancy.placeholder")}
                  onChange={(e) => set("pregnancyOrPostpartumContext", e.target.value)}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="self-start"
                  leftIcon={<X aria-hidden="true" className="size-4" />}
                  onClick={() => set("pregnancyOrPostpartumContext", undefined)}
                >
                  {t("profile.pregnancy.remove")}
                </Button>
              </>
            ) : (
              <>
                <p className="text-sm text-ink-muted">{t("profile.field.pregnancyHint")}</p>
                <Button
                  variant="secondary"
                  className="self-start"
                  leftIcon={<Plus aria-hidden="true" className="size-5" />}
                  onClick={() => set("pregnancyOrPostpartumContext", "")}
                >
                  {t("profile.pregnancy.add")}
                </Button>
              </>
            )}
          </div>
        </Section>

        <Section title={t("profile.section.access")}>
          <fieldset className="flex flex-col">
            <legend className="mb-1 text-base font-medium text-ink">{t("profile.field.barriers")}</legend>
            <p className="mb-1 text-sm text-ink-muted">{t("profile.field.barriersHint")}</p>
            <div className="grid sm:grid-cols-2">
              {ACCESS_BARRIERS.map((b) => (
                <Checkbox
                  key={b}
                  label={t(barrierKey(b))}
                  checked={draft.barriers.includes(b)}
                  onChange={() => set("barriers", toggleValue(draft.barriers, b))}
                />
              ))}
            </div>
          </fieldset>
        </Section>

        <div className="flex flex-col gap-3 pb-4">
          <p className="text-sm font-medium text-ink-muted">{dirty ? t("profile.unsaved") : t("profile.upToDate")}</p>
          <div className="flex flex-wrap gap-3">{actions}</div>
        </div>
      </form>
    </>
  );
}

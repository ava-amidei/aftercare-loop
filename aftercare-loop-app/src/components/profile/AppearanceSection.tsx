"use client";

import { useId } from "react";
import { CheckIcon } from "@heroicons/react/20/solid";
import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { appearanceStrings } from "@/components/theme/appearance-strings";
import { pickContrastText } from "@/components/theme/color";
import { useCurrentLanguage } from "@/lib/i18n";
import {
  ACCENT_PRESETS,
  FONT_SCALES,
  FONT_SCALE_PX,
  effectiveAccent,
  effectiveFontScale,
  useDemoStore,
  useHasHydrated,
} from "@/lib/store";
import type { AccessibilityPreference } from "@/lib/types";
import { cn } from "@/lib/utils/cn";

const NONE: AccessibilityPreference[] = [];

const focusRing =
  "has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary-700";

/**
 * Profile → Appearance: accent swatch picker, text-size control and a live
 * preview. Changes apply immediately (ThemeApplier) and are saved per
 * fictional patient; resetDemo() restores the defaults.
 */
export function AppearanceSection() {
  const s = appearanceStrings(useCurrentLanguage());
  const hydrated = useHasHydrated();
  const headingId = useId();
  const groupId = useId();
  const activeId = useDemoStore((st) => st.activePatientId);
  const appearance = useDemoStore((st) => st.patients[st.activePatientId]?.appearance);
  const a11y = useDemoStore((st) => st.patients[st.activePatientId]?.profile.accessibility ?? NONE);
  const setAppearance = useDemoStore((st) => st.setAppearance);

  if (!hydrated) {
    return <Skeleton className="mt-4 h-72 w-full rounded-3xl" />;
  }

  const accent = effectiveAccent(appearance);
  const scale = effectiveFontScale(appearance, a11y);
  const scaleFromA11y = !appearance?.fontScale && a11y.includes("larger_text");

  return (
    <section aria-labelledby={headingId} className="mt-4" data-testid="appearance-section">
      <Card className="flex flex-col gap-6">
        <CardHeader className="mb-0">
          <CardTitle as="h2" id={headingId}>
            {s.sectionTitle}
          </CardTitle>
          <CardDescription>{s.sectionDescription}</CardDescription>
        </CardHeader>

        <fieldset className="flex flex-col gap-2" aria-describedby={`${groupId}-accent-hint`}>
          <legend className="mb-1 text-base font-medium text-gray-90">{s.accentLegend}</legend>
          <p id={`${groupId}-accent-hint`} className="text-sm text-gray-70">
            {s.accentHint}
          </p>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
            {ACCENT_PRESETS.map((p, idx) => {
              const checked = p.hex === accent;
              const name = s.accentNames[p.id];
              return (
                <label
                  key={p.id}
                  className={cn(
                    "flex min-h-11 cursor-pointer flex-col items-center gap-1.5 rounded-2xl p-2 text-center text-sm font-medium",
                    checked ? "bg-gray-5 text-gray-90" : "text-gray-70 hover:bg-gray-5",
                    focusRing,
                  )}
                >
                  <input
                    type="radio"
                    name={`${groupId}-accent`}
                    value={p.hex}
                    checked={checked}
                    onChange={() => setAppearance(activeId, { accent: p.hex })}
                    className="sr-only"
                  />
                  <span
                    aria-hidden="true"
                    className={cn(
                      "flex size-11 items-center justify-center rounded-full transition-transform",
                      checked && "scale-110 ring-2 ring-gray-90 ring-offset-2 ring-offset-gray-0",
                    )}
                    style={{ backgroundColor: p.hex, color: pickContrastText(p.hex) }}
                  >
                    {checked && <CheckIcon className="size-5" />}
                  </span>
                  <span className="leading-tight">
                    {name}
                    {idx === 0 && <span className="block text-xs font-normal text-gray-70">{s.defaultTag}</span>}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-2" aria-describedby={scaleFromA11y ? `${groupId}-font-hint` : undefined}>
          <legend className="mb-1 text-base font-medium text-gray-90">{s.fontLegend}</legend>
          <div className="grid grid-cols-2 gap-1 rounded-3xl bg-gray-10 p-1 sm:grid-cols-4 sm:rounded-full">
            {FONT_SCALES.map((f) => {
              const checked = f === scale;
              return (
                <label
                  key={f}
                  className={cn(
                    "flex min-h-11 cursor-pointer items-center justify-center rounded-full px-2 text-center font-medium",
                    checked ? "bg-primary font-semibold text-primary-contrast" : "text-gray-70 hover:bg-gray-20 hover:text-gray-90",
                    focusRing,
                  )}
                >
                  <input
                    type="radio"
                    name={`${groupId}-font`}
                    value={f}
                    checked={checked}
                    onChange={() => setAppearance(activeId, { fontScale: f })}
                    className="sr-only"
                  />
                  <span className="flex items-baseline gap-1.5 whitespace-nowrap">
                    {/* Glyph sized relative to the current root: a visual hint of each step. */}
                    <span aria-hidden="true" className="font-bold" style={{ fontSize: `${FONT_SCALE_PX[f] / 17}em` }}>
                      A
                    </span>
                    <span className="text-sm sm:text-base">{s.fontNames[f]}</span>
                  </span>
                </label>
              );
            })}
          </div>
          {scaleFromA11y && (
            <p id={`${groupId}-font-hint`} className="text-sm text-gray-70">
              {s.fontHintFromA11y}
            </p>
          )}
        </fieldset>

        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-gray-70" id={`${groupId}-preview`}>
            {s.previewLabel}
          </p>
          <div
            role="group"
            aria-labelledby={`${groupId}-preview`}
            data-testid="appearance-preview"
            className="flex flex-col gap-3 rounded-3xl p-5"
            style={{ backgroundColor: "var(--color-primary-50)" }}
          >
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="size-3 shrink-0 rounded-full"
                style={{ backgroundColor: "var(--color-primary)" }}
              />
              <p className="text-lg font-semibold text-gray-90">{s.previewTitle}</p>
            </div>
            <p className="text-base text-gray-90">{s.previewBody}</p>
            <span
              aria-hidden="true"
              className="inline-flex min-h-11 w-fit items-center rounded-full px-5 font-semibold"
              style={{ backgroundColor: "var(--color-primary)", color: "var(--color-primary-contrast)" }}
            >
              {s.previewButton}
            </span>
          </div>
        </div>

        {appearance && (
          <div>
            <Button variant="ghost" onClick={() => setAppearance(activeId, { accent: undefined, fontScale: undefined })}>
              {s.resetAppearance}
            </Button>
          </div>
        )}
      </Card>
    </section>
  );
}

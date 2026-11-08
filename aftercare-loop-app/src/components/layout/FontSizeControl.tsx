"use client";

import { useCurrentLanguage } from "@/lib/i18n";
import {
  FONT_SCALES,
  effectiveFontScale,
  stepFontScale,
  useDemoStore,
  useHasHydrated,
} from "@/lib/store";
import type { AccessibilityPreference } from "@/lib/types";
import { appearanceStrings } from "@/components/theme/appearance-strings";
import { cn } from "@/lib/utils/cn";

const NONE: AccessibilityPreference[] = [];

/**
 * A− / A+ buttons in the app bar. Steps the ACTIVE patient's
 * appearance.fontScale through sm → md → lg → xl (applied by ThemeApplier).
 */
export function FontSizeControl({ className }: { className?: string }) {
  const s = appearanceStrings(useCurrentLanguage());
  const hydrated = useHasHydrated();
  const activeId = useDemoStore((st) => st.activePatientId);
  const appearance = useDemoStore((st) => st.patients[st.activePatientId]?.appearance);
  const a11y = useDemoStore((st) => st.patients[st.activePatientId]?.profile.accessibility ?? NONE);
  const setAppearance = useDemoStore((st) => st.setAppearance);

  const scale = effectiveFontScale(appearance, a11y);
  const i = FONT_SCALES.indexOf(scale);
  const atMin = i <= 0;
  const atMax = i >= FONT_SCALES.length - 1;
  const step = (d: 1 | -1) => setAppearance(activeId, { fontScale: stepFontScale(scale, d) });

  const btn = cn(
    "inline-flex min-h-11 min-w-11 items-center justify-center rounded-full font-bold text-gray-90 transition-transform",
    "hover:bg-gray-0 active:scale-95",
    "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary-700",
    "disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100",
  );

  return (
    <div
      role="group"
      aria-label={s.textSizeGroup}
      data-testid="font-size-control"
      className={cn("inline-flex items-center rounded-full bg-gray-5 p-0.5", className)}
    >
      <button
        type="button"
        className={cn(btn, "text-sm")}
        aria-label={s.decreaseText}
        disabled={!hydrated || atMin}
        onClick={() => step(-1)}
      >
        <span aria-hidden="true">A−</span>
      </button>
      <button
        type="button"
        className={cn(btn, "text-lg")}
        aria-label={s.increaseText}
        disabled={!hydrated || atMax}
        onClick={() => step(1)}
      >
        <span aria-hidden="true">A+</span>
      </button>
      <span className="sr-only" role="status" aria-live="polite">
        {hydrated ? s.textSizeNow(s.fontNames[scale]) : ""}
      </span>
    </div>
  );
}

import { BeakerIcon, SignalIcon } from "@heroicons/react/24/outline";
import type { ResponseMode } from "@/lib/types";
import { cn } from "@/lib/utils/cn";

/** Exact text required by ARCHITECTURE §2.9. Do not paraphrase. */
export const SCRIPTED_MODE_TITLE = "Scripted Demo Mode";
export const SCRIPTED_MODE_DETAIL = "Responses are predefined for demonstration purposes.";
export const SCRIPTED_MODE_LABEL = `${SCRIPTED_MODE_TITLE} — ${SCRIPTED_MODE_DETAIL}`;
export const LIVE_MODE_LABEL = "Live AI";

/** Provider name per live mode (shown as "Live AI (Gemini · gemini-3.8-flash)"). */
export const LIVE_PROVIDER_LABELS: Record<Exclude<ResponseMode, "scripted_demo">, string> = {
  live_claude: "Claude",
  live_gemini: "Gemini",
};

export const MODE_LABELS: Record<ResponseMode, string> = {
  live_claude: `${LIVE_MODE_LABEL} (${LIVE_PROVIDER_LABELS.live_claude})`,
  live_gemini: `${LIVE_MODE_LABEL} (${LIVE_PROVIDER_LABELS.live_gemini})`,
  scripted_demo: SCRIPTED_MODE_LABEL,
};

/** "Live AI (Gemini · gemini-3.8-flash)" / "Live AI (Claude)" when the model is unknown. */
export function liveModeLabel(mode: Exclude<ResponseMode, "scripted_demo">, model?: string): string {
  const provider = LIVE_PROVIDER_LABELS[mode] ?? "AI";
  return model ? `${LIVE_MODE_LABEL} (${provider} · ${model})` : `${LIVE_MODE_LABEL} (${provider})`;
}

export interface ModeBadgeProps {
  mode: ResponseMode;
  /** Model id shown for live responses (e.g. "claude-opus-5-5"). */
  model?: string;
  /**
   * Compact shows only the short title visually; the full required sentence
   * stays available to screen readers and as a tooltip.
   */
  compact?: boolean;
  className?: string;
}

export function ModeBadge({ mode, model, compact = false, className }: ModeBadgeProps) {
  if (mode === "scripted_demo") {
    return (
      <span
        data-mode={mode}
        title={SCRIPTED_MODE_LABEL}
        className={cn(
          "inline-flex max-w-full items-start gap-1.5 rounded-2xl bg-warning-soft px-3 py-1 text-sm text-warning-strong",
          className,
        )}
      >
        <BeakerIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        <span>
          <strong className="font-semibold">{SCRIPTED_MODE_TITLE}</strong>
          {compact ? (
            <span className="sr-only"> — {SCRIPTED_MODE_DETAIL}</span>
          ) : (
            <span> — {SCRIPTED_MODE_DETAIL}</span>
          )}
        </span>
      </span>
    );
  }
  const fullLabel = liveModeLabel(mode, model);
  return (
    <span
      data-mode={mode}
      title={fullLabel}
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 rounded-full bg-primary-100 px-3 py-1 text-sm text-primary-900",
        className,
      )}
    >
      <SignalIcon aria-hidden="true" className="size-4 shrink-0" />
      <span className="font-semibold">{compact ? liveModeLabel(mode) : fullLabel}</span>
    </span>
  );
}

import { FlaskConical, Radio } from "lucide-react";
import type { ResponseMode } from "@/lib/types";
import { cn } from "@/lib/utils/cn";

/** Exact text required by ARCHITECTURE §2.9. Do not paraphrase. */
export const SCRIPTED_MODE_TITLE = "Scripted Demo Mode";
export const SCRIPTED_MODE_DETAIL = "Responses are predefined for demonstration purposes.";
export const SCRIPTED_MODE_LABEL = `${SCRIPTED_MODE_TITLE} — ${SCRIPTED_MODE_DETAIL}`;
export const LIVE_MODE_LABEL = "Live response from Claude";

export const MODE_LABELS: Record<ResponseMode, string> = {
  live_claude: LIVE_MODE_LABEL,
  scripted_demo: SCRIPTED_MODE_LABEL,
};

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
          "inline-flex max-w-full items-start gap-1.5 rounded-control border border-warning/40 bg-warning-soft px-2.5 py-1 text-sm text-warning-strong",
          className,
        )}
      >
        <FlaskConical aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
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
  return (
    <span
      data-mode={mode}
      title={model ? `${LIVE_MODE_LABEL} (${model})` : LIVE_MODE_LABEL}
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 rounded-control border border-brand-200 bg-brand-50 px-2.5 py-1 text-sm text-brand-800",
        className,
      )}
    >
      <Radio aria-hidden="true" className="size-4 shrink-0" />
      <span className="font-semibold">{LIVE_MODE_LABEL}</span>
      {model && !compact && <span className="font-mono text-xs opacity-80">{model}</span>}
    </span>
  );
}

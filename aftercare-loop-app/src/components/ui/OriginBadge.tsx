import { DocumentCheckIcon, SparklesIcon, UserIcon } from "@heroicons/react/24/outline";
import type { HeroIcon } from "@/components/ui/icon";
import type { ActionOrigin } from "@/lib/types";
import { cn } from "@/lib/utils/cn";

export interface OriginMeta {
  label: string;
  description: string;
  Icon: HeroIcon;
  className: string;
}

/** Canonical labels for ActionOrigin (ARCHITECTURE §2.4). Never reuse one origin's look for another. */
export const ORIGIN_META: Record<ActionOrigin, OriginMeta> = {
  clinician_documented: {
    label: "Clinician-documented",
    description: "Written in your visit document by your care team.",
    Icon: DocumentCheckIcon,
    className: "bg-origin-clinician-soft text-origin-clinician",
  },
  patient_selected: {
    label: "Patient-selected",
    description: "A goal you chose for yourself.",
    Icon: UserIcon,
    className: "bg-origin-patient-soft text-origin-patient",
  },
  ai_suggested: {
    label: "AI-suggested",
    description: "A suggestion from Ask Kat. Not an instruction from your clinician.",
    Icon: SparklesIcon,
    // Dashed edge = a non-color cue that this is a suggestion (ARCHITECTURE §2.4).
    // The one deliberate exception to DESIGN's "no outlines" rule.
    className: "bg-origin-ai-soft text-origin-ai border border-dashed border-origin-ai/60",
  },
};

export const ORIGIN_LABELS: Record<ActionOrigin, string> = {
  clinician_documented: ORIGIN_META.clinician_documented.label,
  patient_selected: ORIGIN_META.patient_selected.label,
  ai_suggested: ORIGIN_META.ai_suggested.label,
};

export interface OriginBadgeProps {
  origin: ActionOrigin;
  /** Override the label (e.g. translated text). */
  label?: string;
  /** Override the tooltip / screen-reader description. */
  description?: string;
  size?: "sm" | "md";
  /** Render the description inline next to the label. */
  showDescription?: boolean;
  className?: string;
}

export function OriginBadge({
  origin,
  label,
  description,
  size = "md",
  showDescription = false,
  className,
}: OriginBadgeProps) {
  const meta = ORIGIN_META[origin];
  const Icon = meta.Icon;
  const text = label ?? meta.label;
  const desc = description ?? meta.description;
  return (
    <span
      data-origin={origin}
      title={desc}
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 rounded-full font-semibold leading-tight",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm",
        meta.className,
        className,
      )}
    >
      <Icon aria-hidden="true" className={size === "sm" ? "size-3.5" : "size-4"} />
      <span>{text}</span>
      {showDescription ? (
        <span className="font-normal opacity-90">· {desc}</span>
      ) : (
        <span className="sr-only">. {desc}</span>
      )}
    </span>
  );
}

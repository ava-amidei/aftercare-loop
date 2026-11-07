import { Info } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/** Required on every page (ARCHITECTURE §2.1). */
export const DEMO_BANNER_TEXT = "Demonstration using fictional patient data.";

export function DemoBanner({ className, text = DEMO_BANNER_TEXT }: { className?: string; text?: string }) {
  return (
    <div
      role="note"
      data-testid="demo-banner"
      className={cn(
        "flex items-center justify-center gap-2 bg-brand-900 px-safe py-1.5 text-center text-sm font-medium text-white",
        "pt-[max(0.375rem,env(safe-area-inset-top))]",
        className,
      )}
    >
      <Info aria-hidden="true" className="size-4 shrink-0" />
      <span>{text}</span>
    </div>
  );
}

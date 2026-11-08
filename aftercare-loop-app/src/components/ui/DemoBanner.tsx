import { InformationCircleIcon } from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils/cn";

/** Required on every page (ARCHITECTURE §2.1). */
export const DEMO_BANNER_TEXT = "Demonstration using fictional patient data.";

export function DemoBanner({ className, text = DEMO_BANNER_TEXT }: { className?: string; text?: string }) {
  return (
    <div
      role="note"
      data-testid="demo-banner"
      className={cn(
        "flex items-center justify-center gap-2 bg-secondary px-safe py-1.5 text-center text-sm font-semibold text-gray-100",
        "pt-[max(0.375rem,env(safe-area-inset-top))]",
        className,
      )}
    >
      <InformationCircleIcon aria-hidden="true" className="size-4 shrink-0" />
      <span>{text}</span>
    </div>
  );
}

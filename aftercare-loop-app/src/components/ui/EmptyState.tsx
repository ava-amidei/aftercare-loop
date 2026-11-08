import type { ReactNode } from "react";
import { InboxIcon } from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils/cn";

export interface EmptyStateProps {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  /** Primary/secondary actions. */
  action?: ReactNode;
  headingLevel?: "h1" | "h2" | "h3";
  className?: string;
}

export function EmptyState({ title, description, icon, action, headingLevel = "h2", className }: EmptyStateProps) {
  const Heading = headingLevel;
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-3xl bg-gray-0 px-6 py-10 text-center",
        className,
      )}
    >
      <div className="flex size-14 items-center justify-center rounded-full bg-primary-100 text-primary-900">
        {icon ?? <InboxIcon aria-hidden="true" className="size-7" />}
      </div>
      <Heading className="text-xl font-bold text-gray-90">{title}</Heading>
      {description && <p className="max-w-prose text-base text-gray-70">{description}</p>}
      {action && <div className="mt-2 flex flex-wrap justify-center gap-3">{action}</div>}
    </div>
  );
}

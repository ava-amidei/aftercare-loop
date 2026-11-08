import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  /** Small label above the title (e.g. step "Understand"). */
  eyebrow?: ReactNode;
  icon?: ReactNode;
  /** Right-aligned actions (wrap below on mobile). */
  actions?: ReactNode;
  className?: string;
}

/** Page title block. Renders the page's single <h1>. */
export function PageHeader({ title, description, eyebrow, icon, actions, className }: PageHeaderProps) {
  return (
    <header className={cn("mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="flex min-w-0 items-start gap-3">
        {icon && (
          <div className="mt-1 flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary-100 text-primary-900">
            {icon}
          </div>
        )}
        <div className="flex min-w-0 flex-col gap-1">
          {eyebrow && <p className="text-sm font-semibold tracking-wide text-primary-800 uppercase">{eyebrow}</p>}
          <h1 className="text-2xl font-bold text-gray-90 sm:text-3xl">{title}</h1>
          {description && <p className="max-w-prose text-base text-gray-70 sm:text-lg">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
    </header>
  );
}

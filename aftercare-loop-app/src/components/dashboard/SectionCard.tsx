import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils/cn";

export interface SectionCardProps {
  id: string;
  title: ReactNode;
  subtitle?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

/** A labelled dashboard region: <section aria-labelledby> wrapping a Card. */
export function SectionCard({ id, title, subtitle, icon, action, children, className }: SectionCardProps) {
  const headingId = `${id}-heading`;
  return (
    <section aria-labelledby={headingId} className={cn("min-w-0", className)} data-testid={id}>
      <Card className="flex h-full flex-col gap-3">
        <div className="flex items-start gap-3">
          {icon && (
            <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-control bg-brand-50 text-brand-700">
              {icon}
            </span>
          )}
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <h2 id={headingId} className="text-lg font-semibold text-ink">
              {title}
            </h2>
            {subtitle && <p className="text-sm text-ink-muted">{subtitle}</p>}
          </div>
          {action}
        </div>
        <div className="flex flex-1 flex-col gap-3">{children}</div>
      </Card>
    </section>
  );
}

/** Small inline empty state used inside dashboard cards. */
export function InlineEmpty({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-2 rounded-control border border-dashed border-border-strong bg-surface-muted p-3">
      <p className="text-base text-ink-muted">{children}</p>
      {action}
    </div>
  );
}

import type { HTMLAttributes, ReactNode } from "react";
import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export type AlertVariant = "info" | "success" | "warning" | "danger";

const styles: Record<AlertVariant, { box: string; icon: string; Icon: typeof Info }> = {
  info: { box: "bg-info-soft border-info/30 text-info-strong", icon: "text-info", Icon: Info },
  success: { box: "bg-success-soft border-success/30 text-success-strong", icon: "text-success", Icon: CircleCheck },
  warning: {
    box: "bg-warning-soft border-warning/40 text-warning-strong",
    icon: "text-warning",
    Icon: TriangleAlert,
  },
  danger: { box: "bg-danger-soft border-danger/40 text-danger-strong", icon: "text-danger", Icon: CircleAlert },
};

export interface AlertProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  variant?: AlertVariant;
  title?: ReactNode;
  /** Replace the default icon; pass `null` to hide it. */
  icon?: ReactNode | null;
  /** Action area (buttons/links) under the message. */
  action?: ReactNode;
  /**
   * Announce to assistive tech when inserted. Defaults to true for danger
   * (role="alert"), false otherwise (no live role for static notes).
   */
  live?: boolean;
}

export function Alert({ variant = "info", title, icon, action, live, className, children, ...rest }: AlertProps) {
  const s = styles[variant];
  const announce = live ?? variant === "danger";
  const role = announce ? (variant === "danger" || variant === "warning" ? "alert" : "status") : undefined;
  const Icon = s.Icon;
  return (
    <div
      role={role}
      data-variant={variant}
      className={cn("flex gap-3 rounded-card border p-4", s.box, className)}
      {...rest}
    >
      {icon === undefined ? <Icon aria-hidden="true" className={cn("mt-0.5 size-5 shrink-0", s.icon)} /> : icon}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className="text-base text-ink">{children}</div>}
        {action && <div className="mt-2 flex flex-wrap gap-2">{action}</div>}
      </div>
    </div>
  );
}

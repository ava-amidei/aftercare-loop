"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { CheckCircleIcon, ExclamationCircleIcon, ExclamationTriangleIcon, InformationCircleIcon } from "@heroicons/react/24/outline";
import { XMarkIcon } from "@heroicons/react/20/solid";
import { cn } from "@/lib/utils/cn";
import { createId } from "@/lib/utils/ids";

export type ToastVariant = "info" | "success" | "warning" | "danger";

export interface ToastOptions {
  title: string;
  description?: string;
  variant?: ToastVariant;
  /** ms before auto-dismiss; 0 keeps it until dismissed. Default 5000. */
  duration?: number;
  action?: { label: string; onClick: () => void };
}

export interface ToastRecord extends Required<Pick<ToastOptions, "title" | "variant" | "duration">> {
  id: string;
  description?: string;
  action?: ToastOptions["action"];
}

export interface ToastApi {
  toast: (options: ToastOptions) => string;
  dismiss: (id: string) => void;
}

const noop: ToastApi = { toast: () => "", dismiss: () => {} };
const ToastContext = createContext<ToastApi | null>(null);

/** Access the toast API. Outside a <ToastProvider> it is a safe no-op. */
export function useToast(): ToastApi {
  return useContext(ToastContext) ?? noop;
}

const icons = { info: InformationCircleIcon, success: CheckCircleIcon, warning: ExclamationTriangleIcon, danger: ExclamationCircleIcon } as const;
const tones: Record<ToastVariant, string> = {
  info: "[&_svg.toast-icon]:text-info",
  success: "[&_svg.toast-icon]:text-success",
  warning: "[&_svg.toast-icon]:text-warning",
  danger: "[&_svg.toast-icon]:text-danger",
};

function ToastItem({ toast, onDismiss }: { toast: ToastRecord; onDismiss: (id: string) => void }) {
  const Icon = icons[toast.variant];
  useEffect(() => {
    if (toast.duration <= 0) return;
    const t = setTimeout(() => onDismiss(toast.id), toast.duration);
    return () => clearTimeout(t);
  }, [toast.id, toast.duration, onDismiss]);
  return (
    <li
      role={toast.variant === "danger" ? "alert" : "status"}
      className={cn(
        "pointer-events-auto flex w-full animate-scale-in items-start gap-3 rounded-3xl bg-gray-0 p-4 shadow-float",
        tones[toast.variant],
      )}
    >
      <Icon aria-hidden="true" className="toast-icon mt-0.5 size-5 shrink-0" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="font-semibold text-gray-90">{toast.title}</p>
        {toast.description && <p className="text-sm text-gray-70">{toast.description}</p>}
        {toast.action && (
          <button
            type="button"
            className="mt-1 min-h-11 self-start rounded-full px-1 font-semibold text-primary-800 underline underline-offset-4"
            onClick={() => {
              toast.action?.onClick();
              onDismiss(toast.id);
            }}
          >
            {toast.action.label}
          </button>
        )}
      </div>
      <button
        type="button"
        aria-label="Dismiss notification"
        onClick={() => onDismiss(toast.id)}
        className="-mt-2 -mr-2 inline-flex size-11 shrink-0 items-center justify-center rounded-full text-gray-70 hover:bg-gray-10"
      >
        <XMarkIcon aria-hidden="true" className="size-4" />
      </button>
    </li>
  );
}

/**
 * Provides `useToast()`. Toasts stack at the top (never bottom-right, which is
 * reserved for the Ask Kat button).
 */
export function ToastProvider({ children, max = 3 }: { children: ReactNode; max?: number }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((options: ToastOptions) => {
    const id = createId("toast");
    const record: ToastRecord = {
      id,
      title: options.title,
      description: options.description,
      variant: options.variant ?? "info",
      duration: options.duration ?? 5000,
      action: options.action,
    };
    setToasts((list) => [...list, record].slice(-max));
    return id;
  }, [max]);

  const api = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        aria-label="Notifications"
        className="pointer-events-none fixed inset-x-0 top-[calc(env(safe-area-inset-top)+4.5rem)] z-[60] flex justify-center px-4 md:right-4 md:left-auto md:w-96 md:justify-end md:px-0"
      >
        <ol className="flex w-full max-w-md flex-col gap-2">
          {toasts.map((t) => (
            <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
          ))}
        </ol>
      </div>
    </ToastContext.Provider>
  );
}

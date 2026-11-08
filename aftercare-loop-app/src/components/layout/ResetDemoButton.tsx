"use client";

import { useState } from "react";
import { ArrowUturnLeftIcon } from "@heroicons/react/20/solid";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { useToast } from "@/components/ui/Toast";
import { getTranslator, useT } from "@/lib/i18n";
import { useDemoStore } from "@/lib/store/demo-store";
import { cn } from "@/lib/utils/cn";

/**
 * Header "Reset Demo": confirm dialog → resetDemo() (restores fixtures for ALL
 * fictional patients, clears conversations and progress) → toast.
 */
export function ResetDemoButton({ className }: { className?: string }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const resetDemo = useDemoStore((s) => s.resetDemo);
  const { toast } = useToast();

  const confirm = () => {
    resetDemo();
    setOpen(false);
    // The active patient (and so the UI language) may change on reset.
    const st = useDemoStore.getState();
    const tAfter = getTranslator(st.patients[st.activePatientId]?.profile.language ?? "en");
    toast({ title: tAfter("common.resetDemoDone"), variant: "success" });
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className={cn("min-w-11", className)}
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        leftIcon={<ArrowUturnLeftIcon aria-hidden="true" className="size-4" />}
      >
        <span className="sr-only sm:not-sr-only">{t("common.resetDemo")}</span>
      </Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        size="sm"
        title={t("dashboard.reset.confirmTitle")}
        description={t("common.resetDemoConfirm")}
        closeLabel={t("common.close")}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button variant="danger" onClick={confirm}>
              {t("dashboard.reset.confirmAction")}
            </Button>
          </>
        }
      />
    </>
  );
}

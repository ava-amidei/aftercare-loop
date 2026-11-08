"use client";

import { LifebuoyIcon } from "@heroicons/react/24/outline";
import { CheckIcon, PlusIcon } from "@heroicons/react/20/solid";
import type { ActionItem } from "@/lib/types";
import { Button, Card, OriginBadge } from "@/components/ui";
import { barrierKey, originKey, useT } from "@/lib/i18n";
import { toClinicQuestion } from "@/lib/services/barriers";

export interface BarrierSuggestionsProps {
  items: ActionItem[];
  savedQuestions: string[];
  onAddToQuestions: (item: ActionItem) => void;
}

/**
 * Barrier-aware administrative suggestions (SPEC §12.7). Visually separate from
 * documented instructions: dashed, AI-suggested, phrased as questions for the clinic.
 */
export function BarrierSuggestions({ items, savedQuestions, onAddToQuestions }: BarrierSuggestionsProps) {
  const t = useT();
  if (items.length === 0) return null;
  return (
    <section
      aria-labelledby="barrier-suggestions-title"
      data-testid="barrier-suggestions"
      className="flex flex-col gap-3 rounded-3xl border-2 border-dashed border-origin-ai/50 bg-origin-ai-soft/40 p-4 sm:p-5"
    >
      <div className="flex items-start gap-3">
        <LifebuoyIcon aria-hidden="true" className="mt-0.5 size-6 shrink-0 text-origin-ai" />
        <div className="flex flex-col gap-1">
          <h3 id="barrier-suggestions-title" className="text-lg font-semibold text-gray-90">
            {t("actionPlan.barrier.sectionTitle")}
          </h3>
          <p className="text-base text-gray-70">{t("actionPlan.barrier.sectionHint")}</p>
        </div>
      </div>
      <ul className="flex flex-col gap-3">
        {items.map((item) => {
          const clinicQuestion = toClinicQuestion(item.description);
          const added = savedQuestions.some((q) => {
            const saved = q.trim();
            return saved === clinicQuestion || saved === item.description.trim();
          });
          const barrierLabel = item.addressesBarrier
            ? t(barrierKey(item.addressesBarrier)).toLocaleLowerCase(t.lang)
            : "";
          return (
            <li key={item.id}>
              <Card padding="sm" className="flex flex-col gap-2 border-dashed">
                <OriginBadge origin="ai_suggested" label={t(originKey("ai_suggested"))} size="sm" />
                {barrierLabel && (
                  <p className="text-sm font-medium text-gray-70">
                    {t("actionPlan.barrier.because", { barrier: barrierLabel })}
                  </p>
                )}
                <p className="text-base font-semibold text-gray-90">{item.description}</p>
                <div>
                  <Button
                    size="sm"
                    variant={added ? "ghost" : "secondary"}
                    disabled={added}
                    leftIcon={
                      added ? (
                        <CheckIcon aria-hidden="true" className="size-4" />
                      ) : (
                        <PlusIcon aria-hidden="true" className="size-4" />
                      )
                    }
                    onClick={() => onAddToQuestions(item)}
                  >
                    {added ? t("actionPlan.barrier.added") : t("actionPlan.barrier.addToQuestions")}
                  </Button>
                </div>
              </Card>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

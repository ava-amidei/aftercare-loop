"use client";

import type { ConfusionMatrix, EvalSuite } from "@/lib/types";
import { useT } from "@/lib/i18n";

export interface ConfusionMatrixTableProps {
  suite: EvalSuite;
  matrix: ConfusionMatrix;
}

/** 2×2 confusion matrix (expected × detected). TN shows "n/a" when the suite doesn't define it. */
export function ConfusionMatrixTable({ suite, matrix }: ConfusionMatrixTableProps) {
  const t = useT();
  const caption =
    suite === "instruction_extraction" || suite === "safety"
      ? t(`evaluation.confusion.caption.${suite}`)
      : t("evaluation.confusion.caption.default");
  const tn = matrix.trueNegatives;
  // White gutters (border-gray-0) separate filled cells instead of grid outlines.
  const cell = "border-2 border-gray-0 bg-gray-5 px-3 py-2 text-center tabular-nums";
  return (
    <div className="flex flex-col gap-2">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[18rem] border-collapse text-sm">
          <caption className="mb-1 text-left text-sm font-semibold text-gray-90">
            {t("evaluation.confusionMatrix")}
            <span className="block font-normal text-gray-70">{caption}</span>
          </caption>
          <thead>
            <tr>
              <td className="border-2 border-gray-0 bg-gray-10 px-3 py-2" />
              <th scope="col" className={`${cell} bg-gray-5 font-medium`}>
                {t("evaluation.confusion.detected")}
              </th>
              <th scope="col" className={`${cell} bg-gray-5 font-medium`}>
                {t("evaluation.confusion.notDetected")}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row" className="border-2 border-gray-0 bg-gray-10 px-3 py-2 text-left font-medium">
                {t("evaluation.confusion.expected")}: {t("evaluation.confusion.expectedPositive")}
              </th>
              <td className={cell}>
                <span className="font-semibold">{matrix.truePositives}</span>{" "}
                <span className="text-gray-70">({t("evaluation.metric.truePositives")})</span>
              </td>
              <td className={cell}>
                <span className="font-semibold">{matrix.falseNegatives}</span>{" "}
                <span className="text-gray-70">({t("evaluation.metric.falseNegatives")})</span>
              </td>
            </tr>
            <tr>
              <th scope="row" className="border-2 border-gray-0 bg-gray-10 px-3 py-2 text-left font-medium">
                {t("evaluation.confusion.expected")}: {t("evaluation.confusion.expectedNegative")}
              </th>
              <td className={cell}>
                <span className="font-semibold">{matrix.falsePositives}</span>{" "}
                <span className="text-gray-70">({t("evaluation.metric.falsePositives")})</span>
              </td>
              <td className={cell}>
                <span className="font-semibold">{tn ?? t("evaluation.confusion.na")}</span>{" "}
                <span className="text-gray-70">({t("evaluation.metric.trueNegatives")})</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      {tn === undefined && <p className="text-xs text-gray-70">{t("evaluation.confusion.naHint")}</p>}
    </div>
  );
}

"use client";
import { useState } from "react";
import { BookOpen } from "lucide-react";
import { Card, LoadingRegion, PageHeader, Skeleton, SkeletonText, Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui";
import { useT } from "@/lib/i18n";
import { useActivePatientId, useHasHydrated } from "@/lib/store";
import { AskTermPanel } from "./AskTermPanel";
import { VisitSummaryPanel } from "./VisitSummaryPanel";

export type UnderstandTab = "topic" | "summary";

export interface UnderstandViewProps {
  defaultTab?: UnderstandTab;
}

/** Understand My Health (SPEC §3C, §12.4). All state is client-side via useDemoStore. */
export function UnderstandView({ defaultTab = "summary" }: UnderstandViewProps) {
  const t = useT();
  const hydrated = useHasHydrated();
  const patientId = useActivePatientId();
  const [tab, setTab] = useState<string>(defaultTab);

  return (
    <>
      <PageHeader
        title={t("understand.title")}
        description={t("understand.subtitle")}
        icon={<BookOpen aria-hidden="true" className="size-6" />}
      />
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList label={t("understand.tabs.label")}>
          <TabsTrigger value="topic" className="py-2 text-center leading-tight whitespace-normal">{t("understand.tabs.topic")}</TabsTrigger>
          <TabsTrigger value="summary" className="py-2 text-center leading-tight whitespace-normal">{t("understand.tabs.summary")}</TabsTrigger>
        </TabsList>
        <TabsContent value="topic">
          {hydrated ? <AskTermPanel key={patientId} /> : <PanelSkeleton label={t("understand.loading")} />}
        </TabsContent>
        <TabsContent value="summary">
          {hydrated ? <VisitSummaryPanel key={patientId} /> : <PanelSkeleton label={t("understand.loading")} />}
        </TabsContent>
      </Tabs>
    </>
  );
}

function PanelSkeleton({ label }: { label: string }) {
  return (
    <LoadingRegion label={label}>
      <Card>
        <Skeleton className="mb-3 h-5 w-1/3" />
        <Skeleton className="mb-4 h-40 w-full" />
        <SkeletonText lines={2} />
      </Card>
    </LoadingRegion>
  );
}

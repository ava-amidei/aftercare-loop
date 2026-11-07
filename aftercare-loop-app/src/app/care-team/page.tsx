import { Users } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";

// Placeholder — replaced by the owning feature agent.
export default function CareTeamPage() {
  return (
    <>
      <PageHeader title="Care Team (simulated)" />
      <EmptyState
        icon={<Users aria-hidden="true" className="size-7" />}
        title="Coming soon"
        description="A fictional clinician view of requests. Nothing is sent to real clinicians."
      />
    </>
  );
}

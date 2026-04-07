import { WorkflowShell } from "@/components/layout/workflow-shell";
import { JobsOverview } from "@/components/jobs/jobs-overview";

export default function JobsPage() {
  return (
    <WorkflowShell>
      <JobsOverview />
    </WorkflowShell>
  );
}

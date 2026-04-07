import { WorkflowShell } from "@/components/layout/workflow-shell";
import { JobProgressView } from "@/components/jobs/job-progress-view";

export default async function JobProgressPage({
  params
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;

  return (
    <WorkflowShell>
      <JobProgressView jobId={jobId} />
    </WorkflowShell>
  );
}

import { WorkflowShell } from "@/components/layout/workflow-shell";
import { DocumentDetailView } from "@/components/documents/document-detail-view";

export default async function DocumentDetailPage({
  params
}: {
  params: Promise<{ documentId: string }>;
}) {
  const { documentId } = await params;

  return (
    <WorkflowShell>
      <DocumentDetailView documentId={documentId} />
    </WorkflowShell>
  );
}

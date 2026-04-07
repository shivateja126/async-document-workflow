import { ReactNode } from "react";
import { WorkflowShell } from "@/components/layout/workflow-shell";

export default function DashboardLayout({
  children
}: {
  children: ReactNode;
}) {
  return <WorkflowShell>{children}</WorkflowShell>;
}

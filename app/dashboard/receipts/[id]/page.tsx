import { notFound } from "next/navigation";
import { getReceiptById } from "@/app/lib/allocrail/event-store";
import { listCurrentFounderOwnedWorkspaceIds } from "@/app/lib/allocrail/founder";
import { buildAllocRailReceiptHtml } from "@/app/lib/allocrail/receipt-template";

export default async function DashboardReceiptDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const workspaceIds = await listCurrentFounderOwnedWorkspaceIds();
  const receipt = await getReceiptById(id, { workspaceIds });

  if (!receipt) {
    notFound();
  }

  const html = buildAllocRailReceiptHtml(receipt);

  return (
    <iframe
      srcDoc={html}
      title={`AllocRail receipt ${receipt.id}`}
      style={{
        width: "100%",
        minHeight: "100vh",
        border: "none",
        background: "#f5f0e8",
      }}
    />
  );
}

import { getReceiptById } from "@/app/lib/allocrail/event-store";
import { requireCurrentFounder } from "@/app/lib/allocrail/founder";
import { buildAllocRailReceiptHtml } from "@/app/lib/allocrail/receipt-template";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  await requireCurrentFounder();
  const { id } = await context.params;
  const receipt = await getReceiptById(id);

  if (!receipt) {
    return new Response("Receipt not found", { status: 404 });
  }

  const html = buildAllocRailReceiptHtml(receipt);

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="allocrail-audit-${receipt.id}.html"`,
    },
  });
}

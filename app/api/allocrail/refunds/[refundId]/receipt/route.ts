import { requireCurrentFounder } from "@/app/lib/allocrail/founder";
import { retrieveDodoRefundReceipt } from "@/app/lib/allocrail/dodo";

export async function GET(
  _request: Request,
  context: { params: Promise<{ refundId: string }> }
) {
  await requireCurrentFounder();
  const { refundId } = await context.params;

  const response = await retrieveDodoRefundReceipt(refundId);
  const content = await response.arrayBuffer();

  return new Response(content, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="dodo-refund-${refundId}.pdf"`,
    },
  });
}

import { retrieveDodoPaymentReceipt } from "@/app/lib/allocrail/dodo";

export async function GET(
  _request: Request,
  context: { params: Promise<{ paymentId: string }> }
) {
  const { paymentId } = await context.params;

  const response = await retrieveDodoPaymentReceipt(paymentId);
  const content = await response.arrayBuffer();

  return new Response(content, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="dodo-payment-${paymentId}.pdf"`,
    },
  });
}

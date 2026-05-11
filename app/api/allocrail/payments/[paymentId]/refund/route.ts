import { NextRequest, NextResponse } from "next/server";
import {
  listCurrentFounderOwnedWorkspaceIds,
  requireCurrentFounder,
} from "@/app/lib/allocrail/founder";
import { holdRevenueEventSettlement } from "@/app/lib/allocrail/guardrails";
import { requestDodoRefund } from "@/app/lib/allocrail/dodo";
import {
  findRevenueEventByReference,
  updateRevenueEventByPaymentId,
} from "@/app/lib/allocrail/event-store";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ paymentId: string }> }
) {
  try {
    const founder = await requireCurrentFounder();
    const workspaceIds = await listCurrentFounderOwnedWorkspaceIds();
    const { paymentId } = await context.params;
    const body = (await req.json().catch(() => ({}))) as {
      reason?: string;
    };

    const reason =
      typeof body.reason === "string" && body.reason.trim().length > 0
        ? body.reason.trim().slice(0, 3000)
        : `Founder-requested refund by ${founder.fullName}`;

    const revenueEvent = await findRevenueEventByReference(
      { paymentId },
      { workspaceIds }
    );

    if (!revenueEvent) {
      return NextResponse.json(
        { error: "Payment not found in your founder workspace." },
        { status: 404 }
      );
    }

    const refund = await requestDodoRefund({
      paymentId,
      reason,
      metadata: {
        requested_by_user_id: founder.userId,
        requested_by_name: founder.fullName,
        requested_via: "allocrail_dashboard",
      },
    });

    const updatedEvent = await updateRevenueEventByPaymentId(paymentId, (event) => ({
      ...event,
      dodoRefundId: refund.refund_id,
      dodoRefundStatus: refund.status,
      refundReason: refund.reason ?? reason,
      refundRequestedAt: refund.created_at,
      refundedAt: refund.status === "succeeded" ? refund.created_at : event.refundedAt,
    }), { workspaceIds });

    const hold = await holdRevenueEventSettlement({
      paymentId,
      reason: `Refund requested by ${founder.fullName}. Awaiting Dodo confirmation via webhook.`,
    });

    return NextResponse.json({
      ok: true,
      refund,
      hold,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to request refund";
    const status = message === "Unauthorized" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

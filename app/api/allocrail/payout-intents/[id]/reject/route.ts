import { NextResponse } from "next/server";
import {
  getPayoutIntentById,
  updatePayoutIntent,
} from "@/app/lib/allocrail/event-store";
import { requireCurrentFounder } from "@/app/lib/allocrail/founder";

export const runtime = "nodejs";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const founder = await requireCurrentFounder();
  const { id } = await params;
  const intent = await getPayoutIntentById(id);

  if (!intent) {
    return NextResponse.json({ error: "Payout intent not found" }, { status: 404 });
  }

  if (intent.status !== "pending_approval" && intent.status !== "approved") {
    return NextResponse.json(
      {
        error: `Payout intent ${id} cannot be rejected from status ${intent.status}`,
      },
      { status: 409 }
    );
  }

  const updated = await updatePayoutIntent(id, (current) => ({
    ...current,
    status: "rejected",
    rejectedByUserId: founder.userId,
    rejectedByName: founder.fullName,
    rejectedAt: new Date().toISOString(),
    approvedByUserId: undefined,
    approvedByName: undefined,
    approvedAt: undefined,
    failureReason: "Rejected by founder approval control",
    failedAt: undefined,
  }));

  return NextResponse.json({
    ok: true,
    payoutIntent: updated,
  });
}

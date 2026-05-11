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
  try {
    const founder = await requireCurrentFounder();
    const { id } = await params;
    const intent = await getPayoutIntentById(id);

    if (!intent) {
      return NextResponse.json({ error: "Payout intent not found" }, { status: 404 });
    }

    if (intent.status !== "pending_approval") {
      return NextResponse.json({
        ok: true,
        payoutIntent: intent,
        noChange: true,
      });
    }

    const updated = await updatePayoutIntent(id, (current) => ({
      ...current,
      status: "approved",
      approvedByUserId: founder.userId,
      approvedByName: founder.fullName,
      approvedAt: new Date().toISOString(),
      rejectedByUserId: undefined,
      rejectedByName: undefined,
      rejectedAt: undefined,
      failureReason: undefined,
      failedAt: undefined,
    }));

    return NextResponse.json({
      ok: true,
      payoutIntent: updated,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to approve payout intent";
    const status = message === "Unauthorized" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

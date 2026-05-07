import { NextResponse } from "next/server";
import {
  getPayoutIntentById,
  updatePayoutIntent,
} from "@/app/lib/allocrail/event-store";

export const runtime = "nodejs";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
    failureReason: undefined,
    failedAt: undefined,
  }));

  return NextResponse.json({
    ok: true,
    payoutIntent: updated,
  });
}

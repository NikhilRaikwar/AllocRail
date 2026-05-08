import { NextResponse } from "next/server";
import {
  getPayoutIntentById,
  updatePayoutIntent,
} from "@/app/lib/allocrail/event-store";
import { executeUsdcPayout } from "@/app/lib/allocrail/settlement";
import { requireCurrentFounder } from "@/app/lib/allocrail/founder";

export const runtime = "nodejs";

function canExecute(status: string, requiresApproval: boolean) {
  if (status === "submitted" || status === "confirmed") return false;
  if (requiresApproval) {
    return status === "approved" || status === "failed";
  }
  return status === "draft" || status === "approved" || status === "failed";
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireCurrentFounder();
  const { id } = await params;
  const intent = await getPayoutIntentById(id);

  if (!intent) {
    return NextResponse.json({ error: "Payout intent not found" }, { status: 404 });
  }

  if (!canExecute(intent.status, intent.requiresApproval)) {
    return NextResponse.json(
      { error: `Payout intent ${id} is not executable from status ${intent.status}` },
      { status: 409 }
    );
  }

  await updatePayoutIntent(id, (current) => ({
    ...current,
    status: "submitted",
    submittedAt: new Date().toISOString(),
    failureReason: undefined,
    failedAt: undefined,
  }));

  try {
    const settlement = await executeUsdcPayout(intent);
    const updated = await updatePayoutIntent(id, (current) => ({
      ...current,
      status: "confirmed",
      solanaCluster: settlement.cluster,
      solanaSignature: settlement.signature,
      explorerUrl: settlement.explorerUrl,
      submittedAt: settlement.submittedAt,
      confirmedAt: settlement.confirmedAt,
      failureReason: undefined,
      failedAt: undefined,
    }));

    return NextResponse.json({ ok: true, payoutIntent: updated });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to execute payout intent";

    const failed = await updatePayoutIntent(id, (current) => ({
      ...current,
      status: "failed",
      failedAt: new Date().toISOString(),
      failureReason: message,
    }));

    return NextResponse.json({ error: message, payoutIntent: failed }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { listRecentPayoutIntents } from "@/app/lib/allocrail/event-store";
import {
  listCurrentFounderOwnedWorkspaceIds,
  requireCurrentFounder,
} from "@/app/lib/allocrail/founder";

export async function GET() {
  await requireCurrentFounder();
  const workspaceIds = await listCurrentFounderOwnedWorkspaceIds();
  const payoutIntents = await listRecentPayoutIntents({ workspaceIds });

  return NextResponse.json({
    count: payoutIntents.length,
    payoutIntents,
  });
}

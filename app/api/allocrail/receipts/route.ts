import { NextResponse } from "next/server";
import { listRecentReceipts } from "@/app/lib/allocrail/event-store";
import {
  listCurrentFounderOwnedWorkspaceIds,
  requireCurrentFounder,
} from "@/app/lib/allocrail/founder";

export async function GET() {
  await requireCurrentFounder();
  const workspaceIds = await listCurrentFounderOwnedWorkspaceIds();
  const receipts = await listRecentReceipts({ workspaceIds });

  return NextResponse.json({
    count: receipts.length,
    receipts,
  });
}

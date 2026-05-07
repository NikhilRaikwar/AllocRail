import { NextResponse } from "next/server";
import { listRecentPayoutIntents } from "@/app/lib/allocrail/event-store";

export async function GET() {
  const payoutIntents = await listRecentPayoutIntents();

  return NextResponse.json({
    count: payoutIntents.length,
    payoutIntents,
  });
}

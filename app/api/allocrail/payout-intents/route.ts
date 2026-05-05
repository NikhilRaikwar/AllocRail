import { NextResponse } from "next/server";
import { listRecentPayoutIntents } from "@/app/lib/allocrail/event-store";

export function GET() {
  const payoutIntents = listRecentPayoutIntents();

  return NextResponse.json({
    count: payoutIntents.length,
    payoutIntents,
  });
}

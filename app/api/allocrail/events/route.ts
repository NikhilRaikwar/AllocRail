import { NextResponse } from "next/server";
import {
  listRecentPayoutIntents,
  listRecentReceipts,
  listRecentRevenueEvents,
} from "@/app/lib/allocrail/event-store";

export function GET() {
  const events = listRecentRevenueEvents();
  const payoutIntents = listRecentPayoutIntents();
  const receipts = listRecentReceipts();

  return NextResponse.json({
    count: events.length,
    events,
    payoutIntentCount: payoutIntents.length,
    receiptCount: receipts.length,
  });
}

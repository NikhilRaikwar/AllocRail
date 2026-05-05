import { NextResponse } from "next/server";
import { listRecentReceipts } from "@/app/lib/allocrail/event-store";

export function GET() {
  const receipts = listRecentReceipts();

  return NextResponse.json({
    count: receipts.length,
    receipts,
  });
}

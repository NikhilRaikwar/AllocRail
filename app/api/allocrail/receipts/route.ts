import { NextResponse } from "next/server";
import { listRecentReceipts } from "@/app/lib/allocrail/event-store";

export async function GET() {
  const receipts = await listRecentReceipts();

  return NextResponse.json({
    count: receipts.length,
    receipts,
  });
}

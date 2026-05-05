import { NextResponse } from "next/server";
import { getDemoReceipt } from "@/app/lib/allocrail/demo-data";
import { isValidAllocationTotal } from "@/app/lib/allocrail/metadata";

export const runtime = "nodejs";

export function GET() {
  const receipt = getDemoReceipt();
  const totalBps = receipt.allocationRule.buckets.reduce(
    (sum, bucket) => sum + bucket.percentageBps,
    0
  );

  return NextResponse.json({
    receipt,
    checks: {
      totalBps,
      allocationTotalValid: isValidAllocationTotal(totalBps),
      payoutIntentCount: receipt.payoutIntents.length,
    },
  });
}

import { NextResponse } from "next/server";
import { unbindTreasuryOperatorWallet } from "@/app/lib/allocrail/founder";

export const runtime = "nodejs";

export async function DELETE() {
  try {
    const founder = await unbindTreasuryOperatorWallet();
    return NextResponse.json({ founder });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to remove wallet binding";
    const status = message === "Unauthorized" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

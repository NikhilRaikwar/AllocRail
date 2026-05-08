import { NextRequest, NextResponse } from "next/server";
import { issueWalletBindingChallenge } from "@/app/lib/allocrail/founder";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { walletAddress?: string };
    const challenge = await issueWalletBindingChallenge(body.walletAddress ?? "");
    return NextResponse.json({ challenge });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to issue wallet binding challenge";
    const status = message === "Unauthorized" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

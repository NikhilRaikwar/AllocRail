import { NextRequest, NextResponse } from "next/server";
import {
  requireCurrentFounder,
  updateCurrentFounderProfile,
} from "@/app/lib/allocrail/founder";

export async function GET() {
  try {
    const founder = await requireCurrentFounder();
    return NextResponse.json({ founder });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load founder profile";
    const status = message === "Unauthorized" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      fullName?: string;
      treasuryRefillMode?: string;
      fxSource?: string;
      fxRateInrUsd?: number | string;
    };
    const founder = await updateCurrentFounderProfile({
      fullName: body.fullName ?? "",
      treasuryRefillMode: body.treasuryRefillMode as never,
      fxSource: body.fxSource as never,
      fxRateInrUsd: Number(body.fxRateInrUsd),
    });
    return NextResponse.json({ founder });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update founder profile";
    const status = message === "Unauthorized" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

import { NextResponse } from "next/server";
import { checkEnvironment } from "@/app/lib/allocrail/env";

export const runtime = "nodejs";

export function GET() {
  const env = checkEnvironment();

  return NextResponse.json({
    status: env.ok ? "ready" : "missing_configuration",
    service: "allocrail",
    checkedAt: new Date().toISOString(),
    environment: {
      appUrl: env.config.appUrl,
      dodoEnvironment: env.config.dodoEnvironment,
      solanaCluster: env.config.solanaCluster,
      solanaRpcUrl: env.config.solanaRpcUrl,
      solanaUsdcMint: env.config.solanaUsdcMint,
      hasDodoApiKey: env.config.hasDodoApiKey,
      hasDodoWebhookSecret: env.config.hasDodoWebhookSecret,
      hasTreasurySigner: env.config.hasTreasurySigner,
      allocRailProgramId: env.config.allocRailProgramId,
    },
    missing: env.missing,
  });
}

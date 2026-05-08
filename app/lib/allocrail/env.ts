import { CLUSTERS, type ClusterMoniker } from "../solana-client";

export type AppEnvironment = {
  appUrl: string;
  dodoEnvironment: "test_mode" | "live_mode";
  solanaCluster: ClusterMoniker;
  solanaRpcUrl: string;
  solanaUsdcMint: string;
  hasDodoApiKey: boolean;
  hasDodoWebhookSecret: boolean;
  hasSupabase: boolean;
  allocRailProgramId?: string;
};

export type EnvironmentCheck = {
  ok: boolean;
  missing: string[];
  config: AppEnvironment;
};

const DEFAULT_DEVNET_USDC_MINT =
  "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";

function readDodoWebhookSecret() {
  return (
    process.env.DODO_PAYMENTS_WEBHOOK_SECRET ||
    process.env.DODO_PAYMENTS_WEBHOOK_KEY ||
    ""
  );
}

function readSolanaCluster(): ClusterMoniker {
  const cluster = process.env.SOLANA_CLUSTER || "devnet";
  if (CLUSTERS.includes(cluster as ClusterMoniker)) {
    return cluster as ClusterMoniker;
  }
  return "devnet";
}

function readDodoEnvironment(): "test_mode" | "live_mode" {
  return process.env.DODO_PAYMENTS_ENVIRONMENT === "live_mode"
    ? "live_mode"
    : "test_mode";
}

export function getAppEnvironment(): AppEnvironment {
  return {
    appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    dodoEnvironment: readDodoEnvironment(),
    solanaCluster: readSolanaCluster(),
    solanaRpcUrl:
      process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com",
    solanaUsdcMint:
      process.env.SOLANA_USDC_MINT || DEFAULT_DEVNET_USDC_MINT,
    hasDodoApiKey: Boolean(process.env.DODO_PAYMENTS_API_KEY),
    hasDodoWebhookSecret: Boolean(readDodoWebhookSecret()),
    hasSupabase: Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.SUPABASE_SERVICE_ROLE_KEY
    ),
    allocRailProgramId: process.env.ALLOC_RAIL_PROGRAM_ID,
  };
}

export function checkEnvironment(): EnvironmentCheck {
  const config = getAppEnvironment();
  const missing: string[] = [];

  if (!config.hasDodoApiKey) missing.push("DODO_PAYMENTS_API_KEY");
  if (!config.hasDodoWebhookSecret) {
    missing.push("DODO_PAYMENTS_WEBHOOK_SECRET");
  }
  if (!config.hasSupabase) {
    missing.push("NEXT_PUBLIC_SUPABASE_URL");
    missing.push("SUPABASE_SERVICE_ROLE_KEY");
  }

  return {
    ok: missing.length === 0,
    missing,
    config,
  };
}

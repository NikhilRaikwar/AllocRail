import { getSupabaseAdmin } from "./supabase";
import { getSupabaseServerClient } from "@/app/lib/supabase/server";
import type {
  FounderProfile,
  TreasuryFxSource,
  TreasuryRefillMode,
} from "./types";

function fallbackFullName(email: string) {
  return email.split("@")[0]?.replace(/[._-]+/g, " ").trim() || "Founder";
}

const DEFAULT_TREASURY_REFILL_MODE: TreasuryRefillMode = "prefunded_treasury";
const DEFAULT_FX_SOURCE: TreasuryFxSource = "manual_rate";
const DEFAULT_FX_RATE_INR_USD = 83;

type FounderProfileRow = {
  user_id: string;
  email: string;
  full_name: string;
  treasury_operator_wallet: string | null;
  wallet_bound_at: string | null;
  treasury_refill_mode: TreasuryRefillMode | null;
  fx_source: TreasuryFxSource | null;
  fx_rate_inr_usd: number | string | null;
  fx_rate_updated_at: string | null;
  wallet_binding_nonce: string | null;
  wallet_binding_nonce_expires_at: string | null;
};

type TreasuryConfig = Pick<
  FounderProfile,
  "treasuryOperatorWallet" | "treasuryRefillMode" | "fxSource" | "fxRateInrUsd" | "fxRateUpdatedAt"
>;

function mapFounderProfileRow(row: FounderProfileRow): FounderProfile {
  return {
    userId: row.user_id,
    email: row.email,
    fullName: row.full_name,
    treasuryOperatorWallet: row.treasury_operator_wallet ?? undefined,
    walletBoundAt: row.wallet_bound_at ?? undefined,
    treasuryRefillMode: row.treasury_refill_mode ?? DEFAULT_TREASURY_REFILL_MODE,
    fxSource: row.fx_source ?? DEFAULT_FX_SOURCE,
    fxRateInrUsd:
      row.fx_rate_inr_usd == null
        ? DEFAULT_FX_RATE_INR_USD
        : Number(row.fx_rate_inr_usd),
    fxRateUpdatedAt: row.fx_rate_updated_at ?? undefined,
  };
}

function sanitizeWalletAddress(walletAddress?: string | null) {
  const value = walletAddress?.trim();
  return value && value.length > 0 ? value : undefined;
}

function parseTreasuryRefillMode(value: string): TreasuryRefillMode {
  if (
    value === "prefunded_treasury" ||
    value === "manual_rebalance" ||
    value === "external_fx_partner"
  ) {
    return value;
  }
  throw new Error("Invalid treasury refill mode.");
}

function parseFxSource(value: string): TreasuryFxSource {
  if (
    value === "manual_rate" ||
    value === "treasury_desk" ||
    value === "exchange_reference"
  ) {
    return value;
  }
  throw new Error("Invalid FX source.");
}

async function requireAuthUser() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id || !user.email) {
    throw new Error("Unauthorized");
  }

  return user;
}

function buildFounderUpsertRow(input: {
  userId: string;
  email: string;
  fullName: string;
  treasuryOperatorWallet?: string;
  treasuryRefillMode?: TreasuryRefillMode;
  fxSource?: TreasuryFxSource;
  fxRateInrUsd?: number;
  fxRateUpdatedAt?: string;
}) {
  return {
    user_id: input.userId,
    email: input.email,
    full_name: input.fullName,
    treasury_operator_wallet: input.treasuryOperatorWallet ?? null,
    treasury_refill_mode:
      input.treasuryRefillMode ?? DEFAULT_TREASURY_REFILL_MODE,
    fx_source: input.fxSource ?? DEFAULT_FX_SOURCE,
    fx_rate_inr_usd: input.fxRateInrUsd ?? DEFAULT_FX_RATE_INR_USD,
    fx_rate_updated_at:
      input.fxRateUpdatedAt ?? new Date().toISOString(),
  };
}

export function buildWalletBindingMessage(args: {
  userId: string;
  walletAddress: string;
  nonce: string;
}) {
  return [
    "AllocRail treasury operator wallet binding",
    `Founder: ${args.userId}`,
    `Wallet: ${args.walletAddress}`,
    `Nonce: ${args.nonce}`,
  ].join("\n");
}

async function loadFounderProfileRow(userId: string) {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("founder_profiles")
    .select(
      "user_id, email, full_name, treasury_operator_wallet, wallet_bound_at, treasury_refill_mode, fx_source, fx_rate_inr_usd, fx_rate_updated_at, wallet_binding_nonce, wallet_binding_nonce_expires_at"
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as FounderProfileRow | null) ?? null;
}

export async function requireCurrentFounder(): Promise<FounderProfile> {
  const user = await requireAuthUser();
  const existingProfile = await loadFounderProfileRow(user.id);

  const metadataFullName =
    typeof user.user_metadata?.full_name === "string" &&
    user.user_metadata.full_name.trim().length > 0
      ? user.user_metadata.full_name.trim()
      : undefined;

  const fullName =
    metadataFullName ||
    (typeof existingProfile?.full_name === "string" &&
    existingProfile.full_name.trim().length > 0
      ? existingProfile.full_name.trim()
      : undefined) ||
    fallbackFullName(user.email ?? "");

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("founder_profiles")
    .upsert(
      buildFounderUpsertRow({
        userId: user.id,
        email: user.email ?? "",
        fullName,
        treasuryOperatorWallet: sanitizeWalletAddress(
          existingProfile?.treasury_operator_wallet
        ),
        treasuryRefillMode:
          existingProfile?.treasury_refill_mode ?? DEFAULT_TREASURY_REFILL_MODE,
        fxSource: existingProfile?.fx_source ?? DEFAULT_FX_SOURCE,
        fxRateInrUsd:
          existingProfile?.fx_rate_inr_usd == null
            ? DEFAULT_FX_RATE_INR_USD
            : Number(existingProfile.fx_rate_inr_usd),
        fxRateUpdatedAt:
          existingProfile?.fx_rate_updated_at ?? new Date().toISOString(),
      }),
      { onConflict: "user_id" }
    )
    .select(
      "user_id, email, full_name, treasury_operator_wallet, wallet_bound_at, treasury_refill_mode, fx_source, fx_rate_inr_usd, fx_rate_updated_at"
    )
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapFounderProfileRow(data as FounderProfileRow);
}

export async function updateCurrentFounderProfile(
  input: {
    fullName: string;
    treasuryRefillMode: TreasuryRefillMode;
    fxSource: TreasuryFxSource;
    fxRateInrUsd: number;
  }
): Promise<FounderProfile> {
  const user = await requireAuthUser();
  const fullName = input.fullName.trim().replace(/\s+/g, " ");
  if (fullName.length < 2) {
    throw new Error("Full name must be at least 2 characters.");
  }
  const treasuryRefillMode = parseTreasuryRefillMode(input.treasuryRefillMode);
  const fxSource = parseFxSource(input.fxSource);
  const fxRateInrUsd = Number(input.fxRateInrUsd);
  if (!Number.isFinite(fxRateInrUsd) || fxRateInrUsd <= 0) {
    throw new Error("FX rate must be a positive number.");
  }

  const admin = getSupabaseAdmin();
  const existingProfile = await loadFounderProfileRow(user.id);
  const existingMetadata =
    user.user_metadata && typeof user.user_metadata === "object"
      ? user.user_metadata
      : {};

  const { error: authError } = await admin.auth.admin.updateUserById(user.id, {
    user_metadata: {
      ...existingMetadata,
      full_name: fullName,
    },
  });

  if (authError) {
    throw new Error(authError.message);
  }

  const { data, error } = await admin
    .from("founder_profiles")
    .upsert(
      buildFounderUpsertRow({
        userId: user.id,
        email: user.email ?? "",
        fullName,
        treasuryOperatorWallet: sanitizeWalletAddress(
          existingProfile?.treasury_operator_wallet
        ),
        treasuryRefillMode,
        fxSource,
        fxRateInrUsd,
        fxRateUpdatedAt: new Date().toISOString(),
      }),
      { onConflict: "user_id" }
    )
    .select(
      "user_id, email, full_name, treasury_operator_wallet, wallet_bound_at, treasury_refill_mode, fx_source, fx_rate_inr_usd, fx_rate_updated_at"
    )
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapFounderProfileRow(data as FounderProfileRow);
}

export async function issueWalletBindingChallenge(walletAddress: string) {
  const founder = await requireCurrentFounder();
  const sanitizedWalletAddress = sanitizeWalletAddress(walletAddress);
  if (!sanitizedWalletAddress) {
    throw new Error("Connect a wallet before requesting a binding challenge.");
  }

  const nonce = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  const message = buildWalletBindingMessage({
    userId: founder.userId,
    walletAddress: sanitizedWalletAddress,
    nonce,
  });

  const admin = getSupabaseAdmin();
  const { error } = await admin
    .from("founder_profiles")
    .update({
      wallet_binding_nonce: nonce,
      wallet_binding_nonce_expires_at: expiresAt,
    })
    .eq("user_id", founder.userId);

  if (error) {
    throw new Error(error.message);
  }

  return {
    message,
    nonce,
    expiresAt,
  };
}

export async function verifyWalletBinding(args: {
  walletAddress: string;
  signature: string;
  signedMessage: string;
}) {
  const founder = await requireCurrentFounder();
  const profile = await loadFounderProfileRow(founder.userId);

  if (!profile?.wallet_binding_nonce || !profile.wallet_binding_nonce_expires_at) {
    throw new Error("Wallet binding challenge expired. Request a new challenge.");
  }

  const expiresAt = Date.parse(profile.wallet_binding_nonce_expires_at);
  if (Number.isNaN(expiresAt) || expiresAt < Date.now()) {
    throw new Error("Wallet binding challenge expired. Request a new challenge.");
  }

  const walletAddress = sanitizeWalletAddress(args.walletAddress);
  if (!walletAddress) {
    throw new Error("Wallet address is required.");
  }

  return {
    founder,
    nonce: profile.wallet_binding_nonce,
    walletAddress,
  };
}

export async function bindTreasuryOperatorWallet(args: {
  walletAddress: string;
}) {
  const founder = await requireCurrentFounder();
  const walletAddress = sanitizeWalletAddress(args.walletAddress);
  if (!walletAddress) {
    throw new Error("Wallet address is required.");
  }

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("founder_profiles")
    .update({
      treasury_operator_wallet: walletAddress,
      wallet_bound_at: new Date().toISOString(),
      wallet_binding_nonce: null,
      wallet_binding_nonce_expires_at: null,
    })
    .eq("user_id", founder.userId)
    .select(
      "user_id, email, full_name, treasury_operator_wallet, wallet_bound_at, treasury_refill_mode, fx_source, fx_rate_inr_usd, fx_rate_updated_at"
    )
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapFounderProfileRow(data as FounderProfileRow);
}

export async function unbindTreasuryOperatorWallet() {
  const founder = await requireCurrentFounder();
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("founder_profiles")
    .update({
      treasury_operator_wallet: null,
      wallet_bound_at: null,
      wallet_binding_nonce: null,
      wallet_binding_nonce_expires_at: null,
    })
    .eq("user_id", founder.userId)
    .select(
      "user_id, email, full_name, treasury_operator_wallet, wallet_bound_at, treasury_refill_mode, fx_source, fx_rate_inr_usd, fx_rate_updated_at"
    )
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapFounderProfileRow(data as FounderProfileRow);
}

export async function requireBoundFounderWallet(req: Request): Promise<FounderProfile> {
  const founder = await requireCurrentFounder();
  const boundWallet = sanitizeWalletAddress(founder.treasuryOperatorWallet);
  if (!boundWallet) {
    throw new Error("Bind a treasury operator wallet in Profile Settings before approving or executing payouts.");
  }

  const presentedWallet = sanitizeWalletAddress(
    req.headers.get("x-allocrail-wallet-address")
  );
  if (!presentedWallet) {
    throw new Error("Connect the bound treasury operator wallet before approving or executing payouts.");
  }

  if (presentedWallet !== boundWallet) {
    throw new Error("Connected wallet does not match the bound treasury operator wallet.");
  }

  return founder;
}

export async function getTreasuryConfigForWorkspace(
  workspaceId: string
): Promise<TreasuryConfig> {
  if (!workspaceId) {
    return {
      treasuryRefillMode: DEFAULT_TREASURY_REFILL_MODE,
      fxSource: DEFAULT_FX_SOURCE,
      fxRateInrUsd: DEFAULT_FX_RATE_INR_USD,
    };
  }

  const admin = getSupabaseAdmin();
  const { data: workspace, error: workspaceError } = await admin
    .from("workspaces")
    .select("owner_user_id")
    .eq("id", workspaceId)
    .maybeSingle();

  if (workspaceError) {
    throw new Error(workspaceError.message);
  }

  if (!workspace?.owner_user_id) {
    return {
      treasuryRefillMode: DEFAULT_TREASURY_REFILL_MODE,
      fxSource: DEFAULT_FX_SOURCE,
      fxRateInrUsd: DEFAULT_FX_RATE_INR_USD,
    };
  }

  const profile = await loadFounderProfileRow(workspace.owner_user_id);
  if (!profile) {
    return {
      treasuryRefillMode: DEFAULT_TREASURY_REFILL_MODE,
      fxSource: DEFAULT_FX_SOURCE,
      fxRateInrUsd: DEFAULT_FX_RATE_INR_USD,
    };
  }

  return {
    treasuryOperatorWallet: sanitizeWalletAddress(profile.treasury_operator_wallet),
    treasuryRefillMode: profile.treasury_refill_mode ?? DEFAULT_TREASURY_REFILL_MODE,
    fxSource: profile.fx_source ?? DEFAULT_FX_SOURCE,
    fxRateInrUsd:
      profile.fx_rate_inr_usd == null
        ? DEFAULT_FX_RATE_INR_USD
        : Number(profile.fx_rate_inr_usd),
    fxRateUpdatedAt: profile.fx_rate_updated_at ?? undefined,
  };
}

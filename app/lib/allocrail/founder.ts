import { getSupabaseAdmin } from "./supabase";
import { getSupabaseServerClient } from "@/app/lib/supabase/server";
import { demoAllocationRule } from "./demo-data";
import type {
  AllocationRule,
  DodoRoutingMetadata,
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

function sanitizeSlug(value: string) {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return slug || "default";
}

function buildFounderWorkspaceId(userId: string) {
  return `wrk_founder_${userId.replace(/-/g, "")}`;
}

function buildFounderRuleId(userId: string, productTag: string) {
  return `rule_founder_${userId.replace(/-/g, "")}_${sanitizeSlug(productTag)}`;
}

function buildAnonymousWorkspaceId() {
  return `wrk_checkout_${crypto.randomUUID().replace(/-/g, "")}`;
}

function buildAnonymousRuleId(productTag: string) {
  return `rule_checkout_${sanitizeSlug(productTag)}_${crypto.randomUUID().replace(/-/g, "")}`;
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

export async function listCurrentFounderOwnedWorkspaceIds(): Promise<string[]> {
  const founder = await requireCurrentFounder();
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("workspaces")
    .select("id")
    .eq("owner_user_id", founder.userId);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? [])
    .map((row: { id?: unknown }) =>
      row && typeof row.id === "string" ? row.id : null
    )
    .filter((value: string | null): value is string => Boolean(value));
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

export async function ensureCurrentFounderRoutingProfile(input?: {
  productTag?: string;
}): Promise<DodoRoutingMetadata> {
  const founder = await requireCurrentFounder();
  const admin = getSupabaseAdmin();
  const workspaceId = buildFounderWorkspaceId(founder.userId);
  const productTag = input?.productTag?.trim() || demoAllocationRule.productTag;
  const ruleId = buildFounderRuleId(founder.userId, productTag);
  const workspaceName = `${founder.fullName} Treasury Workspace`;

  const { error: workspaceError } = await admin.from("workspaces").upsert(
    {
      id: workspaceId,
      name: workspaceName,
      owner_user_id: founder.userId,
    },
    { onConflict: "id" }
  );

  if (workspaceError) {
    throw new Error(workspaceError.message);
  }

  const { error: membershipError } = await admin
    .from("workspace_memberships")
    .upsert(
      {
        workspace_id: workspaceId,
        user_id: founder.userId,
        role: "owner",
      },
      { onConflict: "workspace_id,user_id" }
    );

  if (membershipError) {
    throw new Error(membershipError.message);
  }

  const rule: AllocationRule = {
    ...demoAllocationRule,
    id: ruleId,
    workspaceId,
    productTag,
    createdByUserId: founder.userId,
    updatedByUserId: founder.userId,
  };

  const { error: ruleError } = await admin
    .from("allocation_rules")
    .upsert(
      {
        id: rule.id,
        workspace_id: rule.workspaceId,
        merchant_id: rule.merchantId,
        name: rule.name,
        product_tag: rule.productTag,
        currency: rule.currency,
        daily_limit_cents: rule.dailyLimitCents,
        enabled: rule.enabled,
        buckets: rule.buckets,
        created_by_user_id: rule.createdByUserId ?? null,
        updated_by_user_id: rule.updatedByUserId ?? null,
      },
      { onConflict: "id" }
    );

  if (ruleError) {
    throw new Error(ruleError.message);
  }

  return {
    workspace_id: workspaceId,
    merchant_id: rule.merchantId,
    rule_id: rule.id,
    product_tag: rule.productTag,
  };
}

export async function provisionStandaloneRoutingProfile(input?: {
  productTag?: string;
  workspaceName?: string;
}): Promise<DodoRoutingMetadata> {
  const admin = getSupabaseAdmin();
  const productTag = input?.productTag?.trim() || demoAllocationRule.productTag;
  const workspaceId = buildAnonymousWorkspaceId();
  const ruleId = buildAnonymousRuleId(productTag);
  const workspaceName =
    input?.workspaceName?.trim() || `AllocRail ${productTag.replace(/[-_]+/g, " ")} checkout`;

  const { error: workspaceError } = await admin.from("workspaces").insert({
    id: workspaceId,
    name: workspaceName,
    owner_user_id: null,
  });

  if (workspaceError) {
    throw new Error(workspaceError.message);
  }

  const { error: ruleError } = await admin
    .from("allocation_rules")
    .insert({
      id: ruleId,
      workspace_id: workspaceId,
      merchant_id: demoAllocationRule.merchantId,
      name: demoAllocationRule.name,
      product_tag: productTag,
      currency: demoAllocationRule.currency,
      daily_limit_cents: demoAllocationRule.dailyLimitCents,
      enabled: demoAllocationRule.enabled,
      buckets: demoAllocationRule.buckets,
      created_by_user_id: null,
      updated_by_user_id: null,
    });

  if (ruleError) {
    throw new Error(ruleError.message);
  }

  return {
    workspace_id: workspaceId,
    merchant_id: demoAllocationRule.merchantId,
    rule_id: ruleId,
    product_tag: productTag,
  };
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

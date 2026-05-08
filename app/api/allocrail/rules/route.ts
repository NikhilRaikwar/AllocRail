import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import {
  listAllAllocationRules,
  upsertAllocationRule,
} from "@/app/lib/allocrail/event-store";
import { requireCurrentFounder } from "@/app/lib/allocrail/founder";
import type { AllocationBucket, AllocationBucketKind } from "@/app/lib/allocrail/types";

export const runtime = "nodejs";

type RulePayload = {
  id?: string;
  name: string;
  workspaceId: string;
  merchantId: string;
  productTag: string;
  dailyLimitUsd: number;
  enabled: boolean;
  buckets: AllocationBucket[];
};

const allowedKinds: AllocationBucketKind[] = [
  "contractor_escrow",
  "tax_reserve",
  "founder_share",
  "agent_budget",
];

function toRuleId(name: string) {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return `rule_${slug || randomUUID().slice(0, 8)}`;
}

function validateRulePayload(payload: RulePayload) {
  if (!payload.name?.trim()) throw new Error("Rule name is required");
  if (!payload.workspaceId?.trim()) throw new Error("Workspace ID is required");
  if (!payload.merchantId?.trim()) throw new Error("Merchant ID is required");
  if (!payload.productTag?.trim()) throw new Error("Product tag is required");
  if (!Number.isFinite(payload.dailyLimitUsd) || payload.dailyLimitUsd <= 0) {
    throw new Error("Daily limit must be greater than zero");
  }
  if (!Array.isArray(payload.buckets) || payload.buckets.length === 0) {
    throw new Error("At least one allocation bucket is required");
  }

  const seenKinds = new Set<string>();
  let totalBps = 0;

  for (const bucket of payload.buckets) {
    if (!allowedKinds.includes(bucket.kind)) {
      throw new Error(`Unsupported bucket kind: ${bucket.kind}`);
    }
    if (seenKinds.has(bucket.kind)) {
      throw new Error(`Duplicate bucket kind: ${bucket.kind}`);
    }
    seenKinds.add(bucket.kind);

    if (!bucket.label?.trim()) throw new Error("Each bucket needs a label");
    if (!bucket.recipientWallet?.trim()) {
      throw new Error(`Recipient wallet missing for ${bucket.label}`);
    }
    if (
      !Number.isInteger(bucket.percentageBps) ||
      bucket.percentageBps <= 0 ||
      bucket.percentageBps > 10000
    ) {
      throw new Error(`Invalid basis points for ${bucket.label}`);
    }
    totalBps += bucket.percentageBps;
  }

  if (totalBps !== 10000) {
    throw new Error(`Total basis points must equal 10,000. Got ${totalBps}`);
  }
}

export async function GET() {
  await requireCurrentFounder();
  const rules = await listAllAllocationRules();
  return NextResponse.json({ rules });
}

export async function POST(request: Request) {
  const founder = await requireCurrentFounder();
  const payload = (await request.json()) as RulePayload;

  try {
    validateRulePayload(payload);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid rule payload" },
      { status: 400 }
    );
  }

  const rule = await upsertAllocationRule({
    id: payload.id?.trim() || toRuleId(payload.name),
    name: payload.name.trim(),
    workspaceId: payload.workspaceId.trim(),
    merchantId: payload.merchantId.trim(),
    productTag: payload.productTag.trim(),
    currency: "USDC",
    dailyLimitCents: Math.round(payload.dailyLimitUsd * 100),
    enabled: payload.enabled,
    buckets: payload.buckets.map((bucket) => ({
      ...bucket,
      label: bucket.label.trim(),
      recipientWallet: bucket.recipientWallet.trim(),
    })),
    createdByUserId: founder.userId,
    updatedByUserId: founder.userId,
  });

  return NextResponse.json({ ok: true, rule });
}

import { NextResponse } from "next/server";
import {
  getAllocationRuleById,
  upsertAllocationRule,
} from "@/app/lib/allocrail/event-store";
import { requireCurrentFounder } from "@/app/lib/allocrail/founder";
import type { AllocationBucket, AllocationBucketKind } from "@/app/lib/allocrail/types";

export const runtime = "nodejs";

type RulePatchPayload = {
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

function validateRulePayload(payload: RulePatchPayload) {
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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const founder = await requireCurrentFounder();
  const { id } = await params;
  const existing = await getAllocationRuleById(id);

  if (!existing) {
    return NextResponse.json({ error: "Rule not found" }, { status: 404 });
  }

  const payload = (await request.json()) as RulePatchPayload;
  try {
    validateRulePayload(payload);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid rule payload" },
      { status: 400 }
    );
  }

  const rule = await upsertAllocationRule({
    ...existing,
    name: payload.name.trim(),
    workspaceId: payload.workspaceId.trim(),
    merchantId: payload.merchantId.trim(),
    productTag: payload.productTag.trim(),
    dailyLimitCents: Math.round(payload.dailyLimitUsd * 100),
    enabled: payload.enabled,
    buckets: payload.buckets.map((bucket) => ({
      ...bucket,
      label: bucket.label.trim(),
      recipientWallet: bucket.recipientWallet.trim(),
    })),
    updatedByUserId: founder.userId,
  });

  return NextResponse.json({ ok: true, rule });
}

import { NextRequest, NextResponse } from "next/server";
import { requireCurrentFounder } from "@/app/lib/allocrail/founder";
import { createStructuredCompletion } from "@/app/lib/allocrail/openai";
import type { AllocationBucketKind } from "@/app/lib/allocrail/types";

export const runtime = "nodejs";

type BucketDraft = {
  kind: AllocationBucketKind;
  label: string;
  percentageBps: number;
  requiresApproval: boolean;
};

type RuleDraftResponse = {
  name: string;
  productTag: string;
  workspaceId: string;
  merchantId: string;
  dailyLimitUsd: number;
  enabled: boolean;
  rationale: string;
  buckets: BucketDraft[];
};

async function resolveFounder(req: NextRequest) {
  const host = req.headers.get("host") ?? "";
  const isLocalDevHost =
    process.env.NODE_ENV !== "production" &&
    (host.startsWith("localhost:") || host.startsWith("127.0.0.1:"));

  if (isLocalDevHost) {
    return {
      userId: "dev-local",
      email: "local-dev@allocrail.test",
      fullName: "Local Dev",
      treasuryRefillMode: "prefunded_treasury" as const,
      fxSource: "manual_rate" as const,
      fxRateInrUsd: 85,
    };
  }

  return requireCurrentFounder();
}

const schema = {
  type: "object",
  additionalProperties: false,
  properties: {
    name: { type: "string" },
    productTag: { type: "string" },
    workspaceId: { type: "string" },
    merchantId: { type: "string" },
    dailyLimitUsd: { type: "number" },
    enabled: { type: "boolean" },
    rationale: { type: "string" },
    buckets: {
      type: "array",
      minItems: 1,
      maxItems: 4,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          kind: {
            type: "string",
            enum: [
              "contractor_escrow",
              "tax_reserve",
              "founder_share",
              "agent_budget",
            ],
          },
          label: { type: "string" },
          percentageBps: { type: "integer" },
          requiresApproval: { type: "boolean" },
        },
        required: ["kind", "label", "percentageBps", "requiresApproval"],
      },
    },
  },
  required: [
    "name",
    "productTag",
    "workspaceId",
    "merchantId",
    "dailyLimitUsd",
    "enabled",
    "rationale",
    "buckets",
  ],
} satisfies Record<string, unknown>;

function validateRuleDraft(draft: RuleDraftResponse) {
  const totalBps = draft.buckets.reduce((sum, bucket) => sum + bucket.percentageBps, 0);
  if (totalBps !== 10000) {
    throw new Error(`AI draft must total 10,000 basis points. Got ${totalBps}.`);
  }

  const seenKinds = new Set<AllocationBucketKind>();
  for (const bucket of draft.buckets) {
    if (seenKinds.has(bucket.kind)) {
      throw new Error(`AI draft repeated bucket kind ${bucket.kind}.`);
    }
    seenKinds.add(bucket.kind);
  }
}

function toKebabCase(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function toReadableName(value: string) {
  return value
    .trim()
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function normalizeRuleDraft(
  draft: RuleDraftResponse,
  workspaceId: string,
  merchantId: string
): RuleDraftResponse {
  return {
    ...draft,
    name: toReadableName(draft.name || "Treasury Revenue Split"),
    productTag: toKebabCase(draft.productTag || draft.name || "treasury-revenue-split"),
    workspaceId,
    merchantId,
    dailyLimitUsd: draft.dailyLimitUsd > 0 ? draft.dailyLimitUsd : 25000,
    rationale: draft.rationale.trim(),
    buckets: draft.buckets.map((bucket) => ({
      ...bucket,
      label: bucket.label.trim() || bucket.kind.replaceAll("_", " "),
    })),
  };
}

export async function POST(req: NextRequest) {
  try {
    await resolveFounder(req);
    const body = (await req.json()) as {
      prompt?: string;
      workspaceId?: string;
      merchantId?: string;
    };

    const prompt = body.prompt?.trim();
    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required." }, { status: 400 });
    }

    const workspaceId = body.workspaceId ?? "wrk_allocrail_demo";
    const merchantId = body.merchantId ?? "mch_india_ai_saas";

    const rawDraft = await createStructuredCompletion<RuleDraftResponse>({
      system: [
        "You are the AllocRail Treasury Rule Copilot.",
        "Draft founder treasury routing rules for Dodo-sourced revenue on Solana.",
        "Use only these bucket kinds: contractor_escrow, tax_reserve, founder_share, agent_budget.",
        "Prefer realistic SaaS/AI treasury splits.",
        "The buckets must total exactly 10,000 basis points.",
        "Do not invent wallet addresses.",
        "Never duplicate a bucket kind.",
        "Use short operational labels.",
        "Choose a kebab-case productTag.",
        "Preserve explicit founder percentages exactly when they are given.",
        "Preserve explicit approval instructions exactly when they are given.",
        "If the founder does not mention a daily limit, use 25000.",
        "Reflect the founder's product context in the rule name and productTag.",
        "Do not include the founder name in the rule name or productTag.",
        "Keep the rationale to one or two sentences.",
      ].join(" "),
      user: [
        `Workspace: ${workspaceId}`,
        `Merchant: ${merchantId}`,
        `Request: ${prompt}`,
      ].join("\n"),
      schemaName: "allocrail_rule_draft",
      schema,
      maxTokens: 700,
    });

    const draft = normalizeRuleDraft(rawDraft, workspaceId, merchantId);
    validateRuleDraft(draft);

    return NextResponse.json({ draft });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to draft treasury rule";
    const status = message === "Unauthorized" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

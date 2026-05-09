import { NextRequest, NextResponse } from "next/server";
import { formatMoney, getDashboardSnapshot, getEventSummary } from "@/app/lib/allocrail/dashboard-data";
import { requireCurrentFounder } from "@/app/lib/allocrail/founder";
import { createStructuredCompletion } from "@/app/lib/allocrail/openai";

export const runtime = "nodejs";

type BudgetSummary = {
  headline: string;
  status: "stable" | "watch" | "action_needed";
  actions: string[];
  observations: string[];
};

const schema = {
  type: "object",
  additionalProperties: false,
  properties: {
    headline: { type: "string" },
    status: {
      type: "string",
      enum: ["stable", "watch", "action_needed"],
    },
    actions: {
      type: "array",
      items: { type: "string" },
      maxItems: 4,
    },
    observations: {
      type: "array",
      items: { type: "string" },
      maxItems: 4,
    },
  },
  required: ["headline", "status", "actions", "observations"],
} satisfies Record<string, unknown>;

async function requireCopilotFounder(req: NextRequest) {
  const host = req.headers.get("host") ?? "";
  const isLocalDevHost =
    process.env.NODE_ENV !== "production" &&
    (host.startsWith("localhost:") || host.startsWith("127.0.0.1:"));

  if (!isLocalDevHost) {
    await requireCurrentFounder();
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireCopilotFounder(req);
    const snapshot = await getDashboardSnapshot();
    const budgetEvents = snapshot.events
      .filter((event) => event.eventContext?.routeKind === "budget_signal")
      .slice(0, 8)
      .map((event) => ({
        type: event.type,
        summary: getEventSummary(event),
        amountCents: event.amountCents,
        currency: event.currency,
        amountDisplay: formatMoney(event.amountCents, event.currency),
        thresholdAmount: event.eventContext?.thresholdAmount,
        thresholdPercent: event.eventContext?.thresholdPercent,
        availableBalance: event.eventContext?.availableBalance,
        entitlement: event.creditEntitlementName ?? event.creditEntitlementId,
      }));

    const budgetIntents = snapshot.payoutIntents
      .filter((intent) => intent.bucketKind === "agent_budget")
      .slice(0, 8)
      .map((intent) => ({
        status: intent.status,
        amountCents: intent.amountCents,
        currency: intent.currency,
        amountDisplay: formatMoney(intent.amountCents, intent.currency),
        requiresApproval: intent.requiresApproval,
      }));

    if (budgetEvents.length === 0 && budgetIntents.length === 0) {
      return NextResponse.json({
        summary: {
          headline: "No AI-agent budget signals are active yet.",
          status: "stable",
          actions: ["Route one payment into the AI-agent budget bucket to start monitoring spend."],
          observations: ["Budget guard will start summarizing once credit or payout signals arrive."],
        } satisfies BudgetSummary,
      });
    }

    const summary = await createStructuredCompletion<BudgetSummary>({
      system: [
        "You are the AllocRail Budget Guard Copilot.",
        "Review AI agent budget signals and payout state.",
        "Be operational, concise, and action-oriented.",
        "Prioritize low-balance risk, blocked budget replenishment, and stale pending approvals.",
        "Keep the headline under 20 words.",
        "Only recommend actions the founder can take from the current dashboard.",
        "Use the provided amountDisplay values in any action text.",
      ].join(" "),
      user: JSON.stringify(
        {
          metrics: {
            budgetSignalCount: snapshot.metrics.budgetSignalCount,
            activeIntentCount: snapshot.metrics.activeIntentCount,
          },
          budgetEvents,
          budgetIntents,
        },
        null,
        2
      ),
      schemaName: "allocrail_budget_summary",
      schema,
      maxTokens: 450,
    });

    return NextResponse.json({ summary });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to analyze budget state";
    const status = message === "Unauthorized" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

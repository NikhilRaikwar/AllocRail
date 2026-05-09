import { NextRequest, NextResponse } from "next/server";
import { formatMoney, getDashboardSnapshot, getEventSummary } from "@/app/lib/allocrail/dashboard-data";
import { requireCurrentFounder } from "@/app/lib/allocrail/founder";
import { createStructuredCompletion } from "@/app/lib/allocrail/openai";

export const runtime = "nodejs";

type ReconcileSummary = {
  headline: string;
  priority: "stable" | "watch" | "action_needed";
  actions: string[];
  risks: string[];
  notes: string[];
};

const schema = {
  type: "object",
  additionalProperties: false,
  properties: {
    headline: { type: "string" },
    priority: {
      type: "string",
      enum: ["stable", "watch", "action_needed"],
    },
    actions: {
      type: "array",
      items: { type: "string" },
      maxItems: 4,
    },
    risks: {
      type: "array",
      items: { type: "string" },
      maxItems: 4,
    },
    notes: {
      type: "array",
      items: { type: "string" },
      maxItems: 4,
    },
  },
  required: ["headline", "priority", "actions", "risks", "notes"],
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
    const recentEvents = snapshot.events.slice(0, 8).map((event) => ({
      type: event.type,
      routeKind: event.eventContext?.routeKind ?? "revenue_route",
      summary: getEventSummary(event),
      amountCents: event.amountCents,
      currency: event.currency,
      amountDisplay: formatMoney(event.amountCents, event.currency),
    }));
    const openPayouts = snapshot.payoutIntents
      .filter((intent) =>
        [
          "draft",
          "pending_approval",
          "approved",
          "submitted",
          "failed",
          "quarantined",
        ].includes(intent.status)
      )
      .slice(0, 10)
      .map((intent) => ({
        bucketKind: intent.bucketKind,
        status: intent.status,
        amountCents: intent.amountCents,
        currency: intent.currency,
        amountDisplay: formatMoney(intent.amountCents, intent.currency),
        requiresApproval: intent.requiresApproval,
      }));

    if (recentEvents.length === 0) {
      return NextResponse.json({
        summary: {
          headline: "No revenue events have landed yet. Start with one Dodo checkout before reviewing the queue.",
          priority: "stable",
          actions: ["Run a demo checkout to generate the first payout route."],
          risks: [],
          notes: ["No founder action is pending because the treasury queue is empty."],
        } satisfies ReconcileSummary,
      });
    }

    if (openPayouts.length === 0) {
      return NextResponse.json({
        summary: {
          headline: "The current treasury queue is clear. No payout route is waiting on founder action.",
          priority: "stable",
          actions: [],
          risks: [],
          notes: ["Recent events are already settled or are signal-only updates."],
        } satisfies ReconcileSummary,
      });
    }

    const summary = await createStructuredCompletion<ReconcileSummary>({
      system: [
        "You are the AllocRail Reconciliation Copilot.",
        "Summarize only operationally useful treasury actions.",
        "Prioritize approvals, failed routes, quarantined routes, and unresolved budget warnings.",
        "Ignore lifecycle noise unless it changes founder action priority.",
        "Keep the headline under 20 words.",
        "Prefer direct founder actions over generic observations.",
        "Use the provided amountDisplay values in any action text.",
      ].join(" "),
      user: JSON.stringify(
        {
          metrics: snapshot.metrics,
          recentEvents,
          openPayouts,
        },
        null,
        2
      ),
      schemaName: "allocrail_reconcile_summary",
      schema,
      maxTokens: 500,
    });

    return NextResponse.json({ summary });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to summarize treasury queue";
    const status = message === "Unauthorized" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

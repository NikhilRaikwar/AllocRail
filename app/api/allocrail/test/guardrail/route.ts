import { NextRequest, NextResponse } from "next/server";
import { requireCurrentFounder } from "@/app/lib/allocrail/founder";
import { applyGuardrailEvent } from "@/app/lib/allocrail/guardrails";
import type { RevenueEventType } from "@/app/lib/allocrail/types";

const SUPPORTED_TEST_EVENTS = new Set<RevenueEventType>([
  "refund.succeeded",
  "refund.failed",
  "dispute.opened",
  "dispute.accepted",
  "dispute.cancelled",
  "dispute.challenged",
  "dispute.expired",
  "dispute.lost",
  "dispute.won",
]);

export async function POST(req: NextRequest) {
  try {
    const host = req.headers.get("host") ?? "";
    const isLocalDevHost =
      process.env.NODE_ENV !== "production" &&
      (host.startsWith("localhost:") || host.startsWith("127.0.0.1:"));

    const founder = isLocalDevHost
      ? {
          userId: "dev-local",
          email: "local-dev@allocrail.test",
          fullName: "Local Dev",
        }
      : await requireCurrentFounder();
    const body = (await req.json()) as {
      eventType?: RevenueEventType;
      paymentId?: string;
      checkoutSessionId?: string;
      subscriptionId?: string;
    };

    if (!body.eventType || !SUPPORTED_TEST_EVENTS.has(body.eventType)) {
      return NextResponse.json(
        { error: "Unsupported guardrail test event." },
        { status: 400 }
      );
    }

    const result = await applyGuardrailEvent({
      eventType: body.eventType,
      paymentId: body.paymentId,
      checkoutSessionId: body.checkoutSessionId,
      subscriptionId: body.subscriptionId,
    });

    return NextResponse.json({
      ok: true,
      simulatedBy: founder.fullName,
      eventType: body.eventType,
      ...result,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to simulate guardrail event";
    const status = message === "Unauthorized" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

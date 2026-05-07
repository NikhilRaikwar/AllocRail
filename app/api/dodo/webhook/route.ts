import { NextRequest, NextResponse } from "next/server";
import type { WebhookPayload } from "dodopayments/resources/webhook-events";
import { getDodoClient } from "@/app/lib/allocrail/dodo";
import {
  hasSeenWebhook,
  recordWebhookEvent,
} from "@/app/lib/allocrail/event-store";
import { getAppEnvironment } from "@/app/lib/allocrail/env";
import {
  createPayoutIntents,
  createReceipt,
  resolveAllocationRule,
} from "@/app/lib/allocrail/routing";
import {
  isRecentWebhookTimestamp,
  isSupportedRevenueEvent,
  toRevenueEvent,
} from "@/app/lib/allocrail/webhook";

export const runtime = "nodejs";

function getWebhookSecret() {
  const secret =
    process.env.DODO_PAYMENTS_WEBHOOK_SECRET ||
    process.env.DODO_PAYMENTS_WEBHOOK_KEY;

  if (!secret) {
    throw new Error("DODO_PAYMENTS_WEBHOOK_SECRET is not configured");
  }

  return secret;
}

function getRequiredHeader(req: NextRequest, key: string) {
  const value = req.headers.get(key);
  if (!value) {
    throw new Error(`Missing required webhook header: ${key}`);
  }
  return value;
}

export function GET() {
  const env = getAppEnvironment();

  return NextResponse.json({
    route: "/api/dodo/webhook",
    method: "POST",
    ready: env.hasDodoWebhookSecret,
    hasWebhookSecret: env.hasDodoWebhookSecret,
    requiredHeaders: [
      "webhook-id",
      "webhook-signature",
      "webhook-timestamp",
    ],
    supportedEvents: [
      "payment.succeeded",
      "subscription.active",
      "subscription.renewed",
      "credit.added",
      "credit.deducted",
    ],
  });
}

export async function POST(req: NextRequest) {
  let body = "";

  try {
    body = await req.text();

    const webhookId = getRequiredHeader(req, "webhook-id");
    const webhookSignature = getRequiredHeader(req, "webhook-signature");
    const webhookTimestamp = getRequiredHeader(req, "webhook-timestamp");

    if (!isRecentWebhookTimestamp(webhookTimestamp)) {
      return NextResponse.json(
        { error: "Webhook timestamp is outside the accepted replay window." },
        { status: 400 }
      );
    }

    if (await hasSeenWebhook(webhookId)) {
      return NextResponse.json({
        ok: true,
        duplicate: true,
        webhookId,
      });
    }

    const payload = (await getDodoClient().webhooks.unwrap(body, {
      headers: {
        "webhook-id": webhookId,
        "webhook-signature": webhookSignature,
        "webhook-timestamp": webhookTimestamp,
      },
      key: getWebhookSecret(),
    })) as WebhookPayload;

    if (!isSupportedRevenueEvent(payload.type)) {
      return NextResponse.json({
        ok: true,
        ignored: true,
        webhookId,
        eventType: payload.type,
      });
    }

    const revenueEvent = toRevenueEvent(webhookId, payload);
    const allocationRule = await resolveAllocationRule(revenueEvent);
    const payoutIntents = createPayoutIntents(revenueEvent, allocationRule);
    const receipt = createReceipt(revenueEvent, allocationRule, payoutIntents);
    await recordWebhookEvent(webhookId, revenueEvent, payoutIntents, receipt);

    return NextResponse.json({
      ok: true,
      webhookId,
      eventType: payload.type,
      revenueEvent,
      allocationRule,
      payoutIntents,
      receipt,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to process webhook";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}

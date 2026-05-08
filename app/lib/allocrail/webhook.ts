import type { WebhookPayload } from "dodopayments/resources/webhook-events";
import { parseDodoRoutingMetadata } from "./metadata";
import type { RevenueEvent, RevenueEventType } from "./types";

const SUPPORTED_REVENUE_EVENTS: RevenueEventType[] = [
  "payment.succeeded",
  "subscription.active",
  "subscription.renewed",
  "credit.added",
  "credit.deducted",
];

const SUPPORTED_GUARDRAIL_EVENTS: RevenueEventType[] = [
  "refund.succeeded",
  "refund.failed",
  "dispute.opened",
  "dispute.expired",
  "dispute.accepted",
  "dispute.cancelled",
  "dispute.challenged",
  "dispute.won",
  "dispute.lost",
];

export function isSupportedRevenueEvent(
  eventType: string
): eventType is RevenueEventType {
  return SUPPORTED_REVENUE_EVENTS.includes(eventType as RevenueEventType);
}

export function isSupportedGuardrailEvent(
  eventType: string
): eventType is RevenueEventType {
  return SUPPORTED_GUARDRAIL_EVENTS.includes(eventType as RevenueEventType);
}

function readAmountUsdCents(payload: WebhookPayload) {
  if ("total_amount" in payload.data && typeof payload.data.total_amount === "number") {
    return payload.data.total_amount;
  }

  if (
    "recurring_pre_tax_amount" in payload.data &&
    typeof payload.data.recurring_pre_tax_amount === "number"
  ) {
    return payload.data.recurring_pre_tax_amount;
  }

  return 0;
}

function toOptionalString(value: string | null | undefined) {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function readCurrency(payload: WebhookPayload) {
  if ("currency" in payload.data) {
    return toOptionalString(payload.data.currency) || "USD";
  }

  return "USD";
}

export function toRevenueEvent(
  dodoEventId: string,
  payload: WebhookPayload
): RevenueEvent {
  const metadata = parseDodoRoutingMetadata(readMetadata(payload));

  return {
    id: `rev_${dodoEventId}`,
    dodoEventId,
    dodoPaymentId:
      "payment_id" in payload.data
        ? toOptionalString(payload.data.payment_id)
        : undefined,
    dodoSubscriptionId:
      "subscription_id" in payload.data
        ? toOptionalString(payload.data.subscription_id)
        : undefined,
    checkoutSessionId:
      "checkout_session_id" in payload.data
        ? toOptionalString(payload.data.checkout_session_id)
        : undefined,
    type: payload.type as RevenueEventType,
    amountCents: readAmountUsdCents(payload),
    currency: readCurrency(payload),
    metadata,
    receivedAt: payload.timestamp,
  };
}

function readMetadata(payload: WebhookPayload) {
  if ("metadata" in payload.data && payload.data.metadata) {
    return payload.data.metadata;
  }

  throw new Error(`Webhook payload for ${payload.type} is missing metadata`);
}

export function readOptionalMetadata(payload: WebhookPayload) {
  if ("metadata" in payload.data && payload.data.metadata) {
    return payload.data.metadata;
  }

  return undefined;
}

export function readPaymentId(payload: WebhookPayload) {
  return "payment_id" in payload.data
    ? toOptionalString(payload.data.payment_id)
    : undefined;
}

export function readRefundId(payload: WebhookPayload) {
  return "refund_id" in payload.data
    ? toOptionalString(payload.data.refund_id)
    : undefined;
}

export function readRefundStatus(payload: WebhookPayload) {
  return "status" in payload.data
    ? toOptionalString(String(payload.data.status))
    : undefined;
}

export function readRefundReason(payload: WebhookPayload) {
  return "reason" in payload.data
    ? toOptionalString(payload.data.reason)
    : undefined;
}

export function readRefundCreatedAt(payload: WebhookPayload) {
  return "created_at" in payload.data
    ? toOptionalString(payload.data.created_at)
    : undefined;
}

export function readCheckoutSessionId(payload: WebhookPayload) {
  return "checkout_session_id" in payload.data
    ? toOptionalString(payload.data.checkout_session_id)
    : undefined;
}

export function readSubscriptionId(payload: WebhookPayload) {
  return "subscription_id" in payload.data
    ? toOptionalString(payload.data.subscription_id)
    : undefined;
}

export function isRecentWebhookTimestamp(
  webhookTimestamp: string,
  toleranceMs = 15 * 60 * 1000
) {
  const ts = Number.parseInt(webhookTimestamp, 10);
  if (!Number.isFinite(ts)) {
    return false;
  }

  const now = Date.now();
  const timestampMs = ts * 1000;
  return Math.abs(now - timestampMs) <= toleranceMs;
}

import { NextRequest, NextResponse } from "next/server";
import type { WebhookPayload } from "dodopayments/resources/webhook-events";
import { parseDodoRoutingMetadata } from "@/app/lib/allocrail/metadata";
import {
  getDodoClient,
  retrieveDodoPayment,
  retrieveDodoSubscription,
} from "@/app/lib/allocrail/dodo";
import {
  findActionableRouteForSubscriptionCycle,
  findLatestRevenueEventByCustomer,
  findRecurringRouteForSubscriptionCycle,
  hasSeenWebhook,
  recordWebhookDelivery,
  recordWebhookEvent,
  updateRevenueEventByPaymentId,
} from "@/app/lib/allocrail/event-store";
import { getAppEnvironment } from "@/app/lib/allocrail/env";
import {
  createPayoutIntents,
  createReceipt,
  resolveAllocationRule,
} from "@/app/lib/allocrail/routing";
import { applyGuardrailEvent } from "@/app/lib/allocrail/guardrails";
import {
  isSupportedGuardrailEvent,
  isRecentWebhookTimestamp,
  readAvailableBalance,
  readCheckoutSessionId,
  readCustomerId,
  readCreditEntitlementId,
  readCreditEntitlementName,
  readLedgerAmount,
  readPaymentId,
  readReferenceId,
  readReferenceType,
  readRefundCreatedAt,
  readRefundId,
  readRefundReason,
  readRefundStatus,
  readRoutingMetadata,
  readSubscriptionId,
  readThresholdAmount,
  readThresholdPercent,
  isSupportedRevenueEvent,
  toRevenueEvent,
} from "@/app/lib/allocrail/webhook";
import type {
  DodoRoutingMetadata,
  RevenueEventContext,
  RevenueEventType,
  RevenueRouteKind,
} from "@/app/lib/allocrail/types";

export const runtime = "nodejs";

async function resolveRoutingMetadata(payload: WebhookPayload): Promise<DodoRoutingMetadata> {
  const inlineMetadata = readRoutingMetadata(payload);
  if (inlineMetadata) {
    return inlineMetadata;
  }

  const paymentId = readPaymentId(payload);
  if (paymentId) {
    const payment = await retrieveDodoPayment(paymentId).catch(() => null);
    if (payment?.metadata) {
      return parseDodoRoutingMetadata(payment.metadata);
    }
  }

  const subscriptionId = readSubscriptionId(payload);
  if (subscriptionId) {
    const subscription = await retrieveDodoSubscription(subscriptionId).catch(() => null);
    if (subscription?.metadata) {
      return parseDodoRoutingMetadata(subscription.metadata);
    }
  }

  const referenceId = readReferenceId(payload);
  const referenceType = readReferenceType(payload)?.toLowerCase();
  if (referenceId && referenceType === "payment") {
    const payment = await retrieveDodoPayment(referenceId).catch(() => null);
    if (payment?.metadata) {
      return parseDodoRoutingMetadata(payment.metadata);
    }
  }

  if (referenceId && referenceType === "subscription") {
    const subscription = await retrieveDodoSubscription(referenceId).catch(() => null);
    if (subscription?.metadata) {
      return parseDodoRoutingMetadata(subscription.metadata);
    }
  }

  const customerId = readCustomerId(payload);
  if (customerId && payload.type.startsWith("credit.")) {
    const customerEvent = await findLatestRevenueEventByCustomer(customerId).catch(
      () => null
    );
    if (customerEvent?.metadata) {
      return customerEvent.metadata;
    }
  }

  throw new Error(`Webhook payload for ${payload.type} is missing routing metadata`);
}

async function buildRoutingPlan(payload: WebhookPayload) {
  const paymentId = readPaymentId(payload);
  const subscriptionId = readSubscriptionId(payload);
  const referenceId = readReferenceId(payload);
  const referenceType = readReferenceType(payload)?.toLowerCase();

  const payment =
    paymentId && payload.type === "payment.succeeded"
      ? await retrieveDodoPayment(paymentId).catch(() => null)
      : paymentId
        ? await retrieveDodoPayment(paymentId).catch(() => null)
        : referenceType === "payment" && referenceId
          ? await retrieveDodoPayment(referenceId).catch(() => null)
          : null;

  const subscription =
    subscriptionId
      ? await retrieveDodoSubscription(subscriptionId).catch(() => null)
      : referenceType === "subscription" && referenceId
        ? await retrieveDodoSubscription(referenceId).catch(() => null)
        : null;

  const type = payload.type as RevenueEventType;

  if (
    type === "credit.deducted" ||
    type === "credit.balance_low" ||
    type === "subscription.cancelled" ||
    type === "subscription.updated"
  ) {
    return {
      payment,
      subscription,
      includeKinds: [] as string[],
      settlementBasis: undefined as
        | { amountCents: number; currency: string }
        | undefined,
    };
  }

  if (type === "credit.added") {
    const creditBasis =
      payment?.settlement_amount && payment.settlement_amount > 0
        ? {
            amountCents: payment.settlement_amount,
            currency: payment.settlement_currency ?? payment.currency,
          }
        : subscription
          ? {
              amountCents: subscription.recurring_pre_tax_amount,
              currency: subscription.currency,
            }
          : undefined;

    return {
      payment,
      subscription,
      includeKinds:
        creditBasis && creditBasis.amountCents > 0 ? ["agent_budget"] : [],
      settlementBasis: creditBasis,
    };
  }

  if (type === "subscription.active" || type === "subscription.renewed") {
    return {
      payment,
      subscription,
      includeKinds: undefined,
      settlementBasis: subscription
        ? {
            amountCents: subscription.recurring_pre_tax_amount,
            currency: subscription.currency,
          }
        : undefined,
    };
  }

  return {
    payment,
    subscription,
    includeKinds: undefined,
    settlementBasis:
      payment?.settlement_amount && payment.settlement_amount > 0
        ? {
            amountCents: payment.settlement_amount,
            currency: payment.settlement_currency ?? payment.currency,
          }
        : undefined,
  };
}

function getRouteKind(type: RevenueEventType): RevenueRouteKind {
  if (type === "subscription.active" || type === "subscription.renewed") {
    return "recurring_route";
  }

  if (
    type === "credit.added" ||
    type === "credit.deducted" ||
    type === "credit.balance_low"
  ) {
    return "budget_signal";
  }

  if (type === "subscription.cancelled" || type === "subscription.updated") {
    return "lifecycle_signal";
  }

  return "revenue_route";
}

function buildEventContext(
  payload: WebhookPayload,
  routingPlan: Awaited<ReturnType<typeof buildRoutingPlan>>
): RevenueEventContext {
  const type = payload.type as RevenueEventType;
  const routeKind = getRouteKind(type);

  const context: RevenueEventContext = {
    routeKind,
    customerId: readCustomerId(payload),
    creditEntitlementId: readCreditEntitlementId(payload),
    creditEntitlementName: readCreditEntitlementName(payload),
    sourceReferenceId: readReferenceId(payload),
    sourceReferenceType: readReferenceType(payload),
  };

  if (routingPlan.subscription) {
    context.subscriptionStatus = routingPlan.subscription.status;
    context.subscriptionProductId = routingPlan.subscription.product_id;
    context.nextBillingDate = routingPlan.subscription.next_billing_date;
  }

  if (type === "credit.added" || type === "credit.deducted") {
    context.ledgerAmount = readLedgerAmount(payload);
  }

  if (type === "credit.balance_low") {
    context.availableBalance = readAvailableBalance(payload);
    context.thresholdAmount = readThresholdAmount(payload);
    context.thresholdPercent = readThresholdPercent(payload);
  }

  if (type === "payment.succeeded") {
    context.summary = "One-time revenue routed into treasury buckets.";
  } else if (type === "subscription.active") {
    context.summary = "Recurring subscription activated and routed into treasury buckets.";
  } else if (type === "subscription.renewed") {
    context.summary = "Recurring subscription renewed and routed into treasury buckets.";
  } else if (type === "subscription.cancelled") {
    context.summary = "Recurring subscription cancelled. No new payout route was created.";
  } else if (type === "subscription.updated") {
    context.summary = "Subscription details changed. Founder review only; no payout route was created.";
  } else if (type === "credit.added") {
    context.summary = "AI budget credits were topped up from a linked billing source.";
  } else if (type === "credit.deducted") {
    context.summary = "AI budget credits were consumed. This is a budget usage signal only.";
  } else if (type === "credit.balance_low") {
    context.summary = "AI budget balance is below its configured threshold.";
  }

  return context;
}

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
      "subscription.cancelled",
      "subscription.updated",
      "credit.added",
      "credit.deducted",
      "credit.balance_low",
      "refund.succeeded",
      "refund.failed",
      "dispute.opened",
      "dispute.accepted",
      "dispute.cancelled",
      "dispute.challenged",
      "dispute.expired",
      "dispute.lost",
      "dispute.won",
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

    if (isSupportedGuardrailEvent(payload.type)) {
      if (payload.type.startsWith("refund.")) {
        const paymentId = readPaymentId(payload);
        if (paymentId) {
          await updateRevenueEventByPaymentId(paymentId, (event) => ({
            ...event,
            dodoRefundId: readRefundId(payload) ?? event.dodoRefundId,
            dodoRefundStatus: readRefundStatus(payload) ?? event.dodoRefundStatus,
            refundReason: readRefundReason(payload) ?? event.refundReason,
            refundRequestedAt:
              readRefundCreatedAt(payload) ?? event.refundRequestedAt,
            refundedAt:
              payload.type === "refund.succeeded"
                ? payload.timestamp
                : event.refundedAt,
          }));
        }
      }

      const result = await applyGuardrailEvent({
        eventType: payload.type,
        paymentId: readPaymentId(payload),
        checkoutSessionId: readCheckoutSessionId(payload),
        subscriptionId: readSubscriptionId(payload),
      });

      await recordWebhookDelivery(webhookId);

      return NextResponse.json({
        ok: true,
        webhookId,
        eventType: payload.type,
        guardrail: true,
        revenueEventId: result.revenueEventId,
        quarantinedCount: result.quarantinedCount,
        matched: result.matched,
        note: result.note,
      });
    }

    if (!isSupportedRevenueEvent(payload.type)) {
      return NextResponse.json({
        ok: true,
        ignored: true,
        webhookId,
        eventType: payload.type,
      });
    }

    const routingPlan = await buildRoutingPlan(payload);
    const metadata = await resolveRoutingMetadata(payload);
    let revenueEvent = toRevenueEvent(webhookId, payload, metadata);
    if (
      revenueEvent.type === "credit.added" &&
      revenueEvent.amountCents === 0 &&
      routingPlan.settlementBasis
    ) {
      revenueEvent = {
        ...revenueEvent,
        amountCents: routingPlan.settlementBasis.amountCents,
        currency: routingPlan.settlementBasis.currency,
      };
    }
    revenueEvent = {
      ...revenueEvent,
      eventContext: buildEventContext(payload, routingPlan),
    };
    let includeKinds = routingPlan.includeKinds;
    let settlementBasis = routingPlan.settlementBasis ?? {
      amountCents: revenueEvent.amountCents,
      currency: revenueEvent.currency,
    };

    if (
      revenueEvent.type === "credit.added" &&
      (!routingPlan.settlementBasis || routingPlan.settlementBasis.amountCents <= 0)
    ) {
      revenueEvent = {
        ...revenueEvent,
        eventContext: {
          routeKind: revenueEvent.eventContext?.routeKind ?? "budget_signal",
          ...revenueEvent.eventContext,
          summary:
            "AI budget credits were granted. Founder review only; no payout route was created.",
        },
      };
    }

    if (
      (revenueEvent.type === "subscription.active" ||
        revenueEvent.type === "subscription.renewed") &&
      revenueEvent.dodoSubscriptionId &&
      revenueEvent.eventContext?.nextBillingDate
    ) {
      const existingActionableRoute = await findActionableRouteForSubscriptionCycle({
        subscriptionId: revenueEvent.dodoSubscriptionId,
        nextBillingDate: revenueEvent.eventContext.nextBillingDate,
      });

      if (existingActionableRoute) {
        includeKinds = [];
        revenueEvent = {
          ...revenueEvent,
          eventContext: {
            ...revenueEvent.eventContext,
            routeKind: "lifecycle_signal",
            summary:
              revenueEvent.type === "subscription.active"
                ? "Subscription activated. Linked payment already created the founder payout route for this billing cycle."
                : "Subscription renewal arrived for the same billing cycle as an existing payout route. Duplicate treasury route suppressed.",
          },
        };
      } else if (revenueEvent.type === "subscription.renewed") {
        const existingCycleRoute = await findRecurringRouteForSubscriptionCycle({
          subscriptionId: revenueEvent.dodoSubscriptionId,
          nextBillingDate: revenueEvent.eventContext.nextBillingDate,
        });

        if (existingCycleRoute) {
          includeKinds = [];
          revenueEvent = {
            ...revenueEvent,
            eventContext: {
              ...revenueEvent.eventContext,
              routeKind: "lifecycle_signal",
              summary:
                "Subscription renewal arrived for the same billing cycle as activation. Duplicate treasury route suppressed.",
            },
          };
        }
      }
    }
    const allocationRule = await resolveAllocationRule(revenueEvent);
    const payoutIntents =
      includeKinds && includeKinds.length === 0
        ? []
        : await createPayoutIntents(
            revenueEvent,
            allocationRule,
            settlementBasis,
            { includeKinds }
          );
    const receipt =
      payoutIntents.length > 0
        ? createReceipt(revenueEvent, allocationRule, payoutIntents)
        : undefined;
    await recordWebhookEvent(webhookId, revenueEvent, payoutIntents, receipt);

    return NextResponse.json({
      ok: true,
      webhookId,
      eventType: payload.type,
      revenueEvent,
      allocationRule,
      payoutIntents,
      receipt,
      routeKind:
        getRouteKind(payload.type as RevenueEventType),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to process webhook";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}

import {
  findRevenueEventByReference,
  updatePayoutIntentsForRevenueEvent,
} from "./event-store";
import type { RevenueEventType } from "./types";

const QUARANTINE_EVENT_TYPES = new Set<RevenueEventType>([
  "refund.succeeded",
  "dispute.opened",
  "dispute.accepted",
  "dispute.challenged",
  "dispute.lost",
]);

function canQuarantineIntent(status: string) {
  return (
    status === "draft" ||
    status === "pending_approval" ||
    status === "approved" ||
    status === "submitted"
  );
}

export async function holdRevenueEventSettlement(params: {
  paymentId?: string;
  checkoutSessionId?: string;
  subscriptionId?: string;
  reason: string;
}) {
  const revenueEvent = await findRevenueEventByReference({
    paymentId: params.paymentId,
    checkoutSessionId: params.checkoutSessionId,
    subscriptionId: params.subscriptionId,
  });

  if (!revenueEvent) {
    return {
      matched: false,
      revenueEventId: undefined,
      quarantinedCount: 0,
      note: "No related revenue event found for this settlement hold.",
    };
  }

  const updatedIntents = await updatePayoutIntentsForRevenueEvent(
    revenueEvent.id,
    (intent) => {
      if (!canQuarantineIntent(intent.status)) {
        return intent;
      }

      return {
        ...intent,
        status: "quarantined",
        failureReason: params.reason,
      };
    }
  );

  return {
    matched: true,
    revenueEventId: revenueEvent.id,
    quarantinedCount: updatedIntents.filter(
      (intent) => intent.status === "quarantined"
    ).length,
    note: undefined,
  };
}

export async function applyGuardrailEvent(params: {
  eventType: RevenueEventType;
  paymentId?: string;
  checkoutSessionId?: string;
  subscriptionId?: string;
}) {
  const revenueEvent = await findRevenueEventByReference({
    paymentId: params.paymentId,
    checkoutSessionId: params.checkoutSessionId,
    subscriptionId: params.subscriptionId,
  });

  if (!revenueEvent) {
    return {
      matched: false,
      revenueEventId: undefined,
      quarantinedCount: 0,
      note: "No related revenue event found for this refund/dispute event.",
    };
  }

  if (!QUARANTINE_EVENT_TYPES.has(params.eventType)) {
    return {
      matched: true,
      revenueEventId: revenueEvent.id,
      quarantinedCount: 0,
      note: "Guardrail event received but no settlement block was required.",
    };
  }

  return holdRevenueEventSettlement({
    paymentId: params.paymentId,
    checkoutSessionId: params.checkoutSessionId,
    subscriptionId: params.subscriptionId,
    reason: `${params.eventType} received from Dodo. Settlement blocked pending founder review.`,
  });
}

import { demoAllocationRule } from "./demo-data";
import { getSupabaseAdmin, isSupabaseConfigured } from "./supabase";
import type {
  AllocationBucket,
  AllocationRule,
  AllocRailReceipt,
  DodoRoutingMetadata,
  PayoutIntent,
  RevenueEvent,
  PayoutIntentStatus,
} from "./types";

type EventStoreState = {
  events: RevenueEvent[];
  payoutIntents: PayoutIntent[];
  receipts: AllocRailReceipt[];
  seenWebhookIds: Set<string>;
  rules: AllocationRule[];
};

type EventStoreScope = {
  workspaceIds?: string[];
};

type ReceiptRow = {
  id: string;
  revenue_event_id: string;
  allocation_rule_id: string;
  created_at: string;
};

type RevenueEventRow = {
  id: string;
  dodo_event_id: string;
  dodo_payment_id: string | null;
  dodo_subscription_id: string | null;
  dodo_customer_id: string | null;
  checkout_session_id: string | null;
  dodo_refund_id: string | null;
  dodo_refund_status: string | null;
  refund_reason: string | null;
  refund_requested_at: string | null;
  refunded_at: string | null;
  credit_entitlement_id: string | null;
  credit_entitlement_name: string | null;
  source_reference_id: string | null;
  source_reference_type: string | null;
  event_context: RevenueEvent["eventContext"] | null;
  type: RevenueEvent["type"];
  amount_cents: number | string;
  currency: string;
  metadata: DodoRoutingMetadata;
  received_at: string;
};

type PayoutIntentRow = {
  id: string;
  revenue_event_id: string;
  bucket_kind: PayoutIntent["bucketKind"];
  recipient_wallet: string;
  amount_cents: number | string;
  currency: "USDC";
  requires_approval: boolean;
  status: PayoutIntentStatus;
  approved_by_user_id: string | null;
  approved_by_name: string | null;
  approved_at: string | null;
  rejected_by_user_id: string | null;
  rejected_by_name: string | null;
  rejected_at: string | null;
  solana_cluster: string | null;
  solana_signature: string | null;
  explorer_url: string | null;
  submitted_at: string | null;
  confirmed_at: string | null;
  failed_at: string | null;
  failure_reason: string | null;
};

type AllocationRuleRow = {
  id: string;
  workspace_id: string;
  merchant_id: string;
  name: string;
  product_tag: string;
  currency: "USDC";
  daily_limit_cents: number | string;
  enabled: boolean;
  buckets: AllocationBucket[];
  created_by_user_id: string | null;
  updated_by_user_id: string | null;
};

const MAX_EVENTS = 50;

declare global {
  var __allocRailEventStore: EventStoreState | undefined;
}

function getMemoryState(): EventStoreState {
  if (!globalThis.__allocRailEventStore) {
    globalThis.__allocRailEventStore = {
      events: [],
      payoutIntents: [],
      receipts: [],
      seenWebhookIds: new Set<string>(),
      rules: [demoAllocationRule],
    };
  }

  if (!Array.isArray(globalThis.__allocRailEventStore.rules)) {
    globalThis.__allocRailEventStore.rules = [demoAllocationRule];
  }

  if (!(globalThis.__allocRailEventStore.seenWebhookIds instanceof Set)) {
    globalThis.__allocRailEventStore.seenWebhookIds = new Set<string>();
  }

  return globalThis.__allocRailEventStore;
}

function toNumber(value: number | string) {
  return typeof value === "number" ? value : Number(value);
}

function mapRuleRow(row: AllocationRuleRow): AllocationRule {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    merchantId: row.merchant_id,
    name: row.name,
    productTag: row.product_tag,
    currency: row.currency,
    dailyLimitCents: toNumber(row.daily_limit_cents),
    enabled: row.enabled,
    buckets: Array.isArray(row.buckets) ? row.buckets : [],
    createdByUserId: row.created_by_user_id ?? undefined,
    updatedByUserId: row.updated_by_user_id ?? undefined,
  };
}

function mapRevenueEventRow(row: RevenueEventRow): RevenueEvent {
  return {
    id: row.id,
    dodoEventId: row.dodo_event_id,
    dodoPaymentId: row.dodo_payment_id ?? undefined,
    dodoSubscriptionId: row.dodo_subscription_id ?? undefined,
    dodoCustomerId: row.dodo_customer_id ?? undefined,
    checkoutSessionId: row.checkout_session_id ?? undefined,
    dodoRefundId: row.dodo_refund_id ?? undefined,
    dodoRefundStatus: row.dodo_refund_status ?? undefined,
    refundReason: row.refund_reason ?? undefined,
    refundRequestedAt: row.refund_requested_at ?? undefined,
    refundedAt: row.refunded_at ?? undefined,
    creditEntitlementId: row.credit_entitlement_id ?? undefined,
    creditEntitlementName: row.credit_entitlement_name ?? undefined,
    sourceReferenceId: row.source_reference_id ?? undefined,
    sourceReferenceType: row.source_reference_type ?? undefined,
    eventContext: row.event_context ?? undefined,
    type: row.type,
    amountCents: toNumber(row.amount_cents),
    currency: row.currency,
    metadata: row.metadata,
    receivedAt: row.received_at,
  };
}

function mapPayoutIntentRow(row: PayoutIntentRow): PayoutIntent {
  return {
    id: row.id,
    revenueEventId: row.revenue_event_id,
    bucketKind: row.bucket_kind,
    recipientWallet: row.recipient_wallet,
    amountCents: toNumber(row.amount_cents),
    currency: row.currency,
    requiresApproval: row.requires_approval,
    status: row.status,
    approvedByUserId: row.approved_by_user_id ?? undefined,
    approvedByName: row.approved_by_name ?? undefined,
    approvedAt: row.approved_at ?? undefined,
    rejectedByUserId: row.rejected_by_user_id ?? undefined,
    rejectedByName: row.rejected_by_name ?? undefined,
    rejectedAt: row.rejected_at ?? undefined,
    solanaCluster: row.solana_cluster ?? undefined,
    solanaSignature: row.solana_signature ?? undefined,
    explorerUrl: row.explorer_url ?? undefined,
    submittedAt: row.submitted_at ?? undefined,
    confirmedAt: row.confirmed_at ?? undefined,
    failedAt: row.failed_at ?? undefined,
    failureReason: row.failure_reason ?? undefined,
  };
}

function toRuleRow(rule: AllocationRule): AllocationRuleRow {
  return {
    id: rule.id,
    workspace_id: rule.workspaceId,
    merchant_id: rule.merchantId,
    name: rule.name,
    product_tag: rule.productTag,
    currency: rule.currency,
    daily_limit_cents: rule.dailyLimitCents,
    enabled: rule.enabled,
    buckets: rule.buckets,
    created_by_user_id: rule.createdByUserId ?? null,
    updated_by_user_id: rule.updatedByUserId ?? null,
  };
}

function toRevenueEventRow(event: RevenueEvent): RevenueEventRow {
  return {
    id: event.id,
    dodo_event_id: event.dodoEventId,
    dodo_payment_id: event.dodoPaymentId ?? null,
    dodo_subscription_id: event.dodoSubscriptionId ?? null,
    dodo_customer_id: event.dodoCustomerId ?? null,
    checkout_session_id: event.checkoutSessionId ?? null,
    dodo_refund_id: event.dodoRefundId ?? null,
    dodo_refund_status: event.dodoRefundStatus ?? null,
    refund_reason: event.refundReason ?? null,
    refund_requested_at: event.refundRequestedAt ?? null,
    refunded_at: event.refundedAt ?? null,
    credit_entitlement_id: event.creditEntitlementId ?? null,
    credit_entitlement_name: event.creditEntitlementName ?? null,
    source_reference_id: event.sourceReferenceId ?? null,
    source_reference_type: event.sourceReferenceType ?? null,
    event_context: event.eventContext ?? null,
    type: event.type,
    amount_cents: event.amountCents,
    currency: event.currency,
    metadata: event.metadata,
    received_at: event.receivedAt,
  };
}

function toPayoutIntentRow(intent: PayoutIntent): PayoutIntentRow {
  return {
    id: intent.id,
    revenue_event_id: intent.revenueEventId,
    bucket_kind: intent.bucketKind,
    recipient_wallet: intent.recipientWallet,
    amount_cents: intent.amountCents,
    currency: intent.currency,
    requires_approval: intent.requiresApproval,
    status: intent.status,
    approved_by_user_id: intent.approvedByUserId ?? null,
    approved_by_name: intent.approvedByName ?? null,
    approved_at: intent.approvedAt ?? null,
    rejected_by_user_id: intent.rejectedByUserId ?? null,
    rejected_by_name: intent.rejectedByName ?? null,
    rejected_at: intent.rejectedAt ?? null,
    solana_cluster: intent.solanaCluster ?? null,
    solana_signature: intent.solanaSignature ?? null,
    explorer_url: intent.explorerUrl ?? null,
    submitted_at: intent.submittedAt ?? null,
    confirmed_at: intent.confirmedAt ?? null,
    failed_at: intent.failedAt ?? null,
    failure_reason: intent.failureReason ?? null,
  };
}

async function loadSupabaseState(scope?: EventStoreScope) {
  const supabase = getSupabaseAdmin();
  const workspaceIds = scope?.workspaceIds?.filter(Boolean) ?? [];

  if (scope?.workspaceIds && workspaceIds.length === 0) {
    return {
      events: [] as RevenueEvent[],
      payoutIntents: [] as PayoutIntent[],
      receipts: [] as AllocRailReceipt[],
      rules: [] as AllocationRule[],
    };
  }

  let rulesQuery = supabase
    .from("allocation_rules")
    .select("*")
    .order("updated_at", { ascending: false });

  if (workspaceIds.length > 0) {
    rulesQuery = rulesQuery.in("workspace_id", workspaceIds);
  }

  const [eventsResult, payoutIntentsResult, receiptsResult, rulesResult] =
    await Promise.all([
      supabase
        .from("revenue_events")
        .select("*")
        .order("received_at", { ascending: false })
        .limit(MAX_EVENTS * 10),
      supabase
        .from("payout_intents")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(MAX_EVENTS * 20),
      supabase
        .from("receipts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(MAX_EVENTS * 10),
      rulesQuery,
    ]);

  for (const result of [
    eventsResult,
    payoutIntentsResult,
    receiptsResult,
    rulesResult,
  ]) {
    if (result.error) {
      throw new Error(result.error.message);
    }
  }

  const events: RevenueEvent[] = (eventsResult.data ?? [])
    .map((row: unknown) => mapRevenueEventRow(row as RevenueEventRow))
    .filter((event: RevenueEvent) =>
      workspaceIds.length > 0
        ? workspaceIds.includes(event.metadata.workspace_id)
        : true
    )
    .slice(0, MAX_EVENTS);
  const payoutIntents: PayoutIntent[] = (payoutIntentsResult.data ?? []).map((row: unknown) =>
    mapPayoutIntentRow(row as PayoutIntentRow)
  );
  const rules: AllocationRule[] = (rulesResult.data ?? [])
    .map((row: unknown) => mapRuleRow(row as AllocationRuleRow))
    .filter((rule: AllocationRule) =>
      workspaceIds.length > 0 ? workspaceIds.includes(rule.workspaceId) : true
    );

  const eventsById = new Map(events.map((event: RevenueEvent) => [event.id, event]));
  const rulesById = new Map(rules.map((rule: AllocationRule) => [rule.id, rule]));
  const intentsByEventId = new Map<string, PayoutIntent[]>();

  for (const intent of payoutIntents as PayoutIntent[]) {
    if (!eventsById.has(intent.revenueEventId)) {
      continue;
    }
    const existing = intentsByEventId.get(intent.revenueEventId) ?? [];
    existing.push(intent);
    intentsByEventId.set(intent.revenueEventId, existing);
  }

  const receipts: AllocRailReceipt[] = (receiptsResult.data ?? [])
    .map((row: unknown) => row as ReceiptRow)
    .map((row: ReceiptRow) => {
      const revenueEvent = eventsById.get(row.revenue_event_id);
      const allocationRule = rulesById.get(row.allocation_rule_id);
      if (!revenueEvent || !allocationRule) {
        return null;
      }

      return {
        id: row.id,
        revenueEvent,
        allocationRule,
        payoutIntents: intentsByEventId.get(row.revenue_event_id) ?? [],
      } satisfies AllocRailReceipt;
    })
    .filter(
      (receipt: AllocRailReceipt | null): receipt is AllocRailReceipt =>
        receipt != null
    );

  return {
    events,
    payoutIntents,
    receipts,
    rules,
  };
}

function loadMemoryState() {
  const state = getMemoryState();
  return {
    events: [...state.events],
    payoutIntents: [...state.payoutIntents],
    receipts: [...state.receipts],
    rules: [...state.rules],
  };
}

export async function hasSeenWebhook(webhookId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return getMemoryState().seenWebhookIds.has(webhookId);
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("webhook_deliveries")
    .select("webhook_id")
    .eq("webhook_id", webhookId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return Boolean(data);
}

export async function recordWebhookDelivery(webhookId: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    getMemoryState().seenWebhookIds.add(webhookId);
    return;
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("webhook_deliveries")
    .upsert({ webhook_id: webhookId }, { onConflict: "webhook_id" });

  if (error) {
    throw new Error(error.message);
  }
}

export async function listAllocationRules(scope?: EventStoreScope): Promise<AllocationRule[]> {
  if (!isSupabaseConfigured()) {
    return loadMemoryState().rules;
  }

  const { rules } = await loadSupabaseState(scope);
  return rules.filter((rule) => rule.enabled);
}

export async function listAllAllocationRules(scope?: EventStoreScope): Promise<AllocationRule[]> {
  if (!isSupabaseConfigured()) {
    return loadMemoryState().rules;
  }

  const { rules } = await loadSupabaseState(scope);
  return rules;
}

export async function getAllocationRuleById(
  id: string
): Promise<AllocationRule | undefined> {
  if (!isSupabaseConfigured()) {
    return loadMemoryState().rules.find((rule) => rule.id === id);
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("allocation_rules")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapRuleRow(data as AllocationRuleRow) : undefined;
}

export async function findAllocationRuleByMetadata(
  metadata: DodoRoutingMetadata
): Promise<AllocationRule | null> {
  if (!isSupabaseConfigured()) {
    return (
      loadMemoryState().rules.find(
        (rule) =>
          rule.id === metadata.rule_id &&
          rule.workspaceId === metadata.workspace_id &&
          rule.merchantId === metadata.merchant_id &&
          rule.productTag === metadata.product_tag &&
          rule.enabled
      ) ?? null
    );
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("allocation_rules")
    .select("*")
    .eq("id", metadata.rule_id)
    .eq("workspace_id", metadata.workspace_id)
    .eq("merchant_id", metadata.merchant_id)
    .eq("product_tag", metadata.product_tag)
    .eq("enabled", true)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapRuleRow(data as AllocationRuleRow) : null;
}

async function syncAllocationRule(rule: AllocationRule) {
  if (!isSupabaseConfigured()) {
    const state = getMemoryState();
    const others = state.rules.filter((existing) => existing.id !== rule.id);
    state.rules = [rule, ...others];
    return;
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("allocation_rules")
    .upsert(toRuleRow(rule), { onConflict: "id" });

  if (error) {
    throw new Error(error.message);
  }
}

export async function upsertAllocationRule(
  rule: AllocationRule
): Promise<AllocationRule> {
  if (!isSupabaseConfigured()) {
    await syncAllocationRule(rule);
    return rule;
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("allocation_rules")
    .upsert(toRuleRow(rule), { onConflict: "id" })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapRuleRow(data as AllocationRuleRow);
}

export async function deleteAllocationRule(id: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    const state = getMemoryState();
    state.rules = state.rules.filter((rule) => rule.id !== id);
    return;
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("allocation_rules").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}

export async function recordWebhookEvent(
  webhookId: string,
  event: RevenueEvent,
  payoutIntents: PayoutIntent[],
  receipt?: AllocRailReceipt
): Promise<void> {
  if (!isSupabaseConfigured()) {
    const state = getMemoryState();
    state.seenWebhookIds.add(webhookId);
    if (receipt) {
      state.rules = [
        receipt.allocationRule,
        ...state.rules.filter((rule) => rule.id !== receipt.allocationRule.id),
      ];
    }
    state.events.unshift(event);
    state.events = state.events.slice(0, MAX_EVENTS);
    state.payoutIntents = [...payoutIntents, ...state.payoutIntents].slice(
      0,
      MAX_EVENTS * 4
    );
    if (receipt) {
      state.receipts.unshift(receipt);
      state.receipts = state.receipts.slice(0, MAX_EVENTS);
    }
    return;
  }

  const supabase = getSupabaseAdmin();

  if (receipt) {
    await syncAllocationRule(receipt.allocationRule);
  }

  const { error: eventError } = await supabase
    .from("revenue_events")
    .upsert(toRevenueEventRow(event), { onConflict: "id" });
  if (eventError) {
    throw new Error(eventError.message);
  }

  const { error: intentsError } = await supabase
    .from("payout_intents")
    .upsert(payoutIntents.map(toPayoutIntentRow), { onConflict: "id" });
  if (intentsError) {
    throw new Error(intentsError.message);
  }

  if (receipt) {
    const { error: receiptError } = await supabase.from("receipts").upsert(
      {
        id: receipt.id,
        revenue_event_id: receipt.revenueEvent.id,
        allocation_rule_id: receipt.allocationRule.id,
      },
      { onConflict: "id" }
    );
    if (receiptError) {
      throw new Error(receiptError.message);
    }
  }

  const { error: deliveryError } = await supabase
    .from("webhook_deliveries")
    .upsert({ webhook_id: webhookId }, { onConflict: "webhook_id" });
  if (deliveryError) {
    throw new Error(deliveryError.message);
  }
}

export async function listRecentRevenueEvents(scope?: EventStoreScope): Promise<RevenueEvent[]> {
  if (!isSupabaseConfigured()) {
    return loadMemoryState().events;
  }

  const { events } = await loadSupabaseState(scope);
  return events;
}

export async function listRecentPayoutIntents(scope?: EventStoreScope): Promise<PayoutIntent[]> {
  if (!isSupabaseConfigured()) {
    return loadMemoryState().payoutIntents;
  }

  const { payoutIntents } = await loadSupabaseState(scope);
  return payoutIntents;
}

export async function listRecentReceipts(scope?: EventStoreScope): Promise<AllocRailReceipt[]> {
  if (!isSupabaseConfigured()) {
    return loadMemoryState().receipts;
  }

  const { receipts } = await loadSupabaseState(scope);
  return receipts;
}

export async function getReceiptById(
  id: string,
  scope?: EventStoreScope
): Promise<AllocRailReceipt | undefined> {
  const receipts = await listRecentReceipts(scope);
  return receipts.find((receipt) => receipt.id === id);
}

export async function findRevenueEventByReference({
  paymentId,
  checkoutSessionId,
  subscriptionId,
}: {
  paymentId?: string;
  checkoutSessionId?: string;
  subscriptionId?: string;
}, scope?: EventStoreScope): Promise<RevenueEvent | undefined> {
  if (!paymentId && !checkoutSessionId && !subscriptionId) {
    return undefined;
  }

  if (!isSupabaseConfigured()) {
    return loadMemoryState().events.find(
      (event) =>
        (paymentId && event.dodoPaymentId === paymentId) ||
        (checkoutSessionId && event.checkoutSessionId === checkoutSessionId) ||
        (subscriptionId && event.dodoSubscriptionId === subscriptionId)
    );
  }

  const filters: string[] = [];
  if (paymentId) {
    filters.push(`dodo_payment_id.eq.${paymentId}`);
  }
  if (checkoutSessionId) {
    filters.push(`checkout_session_id.eq.${checkoutSessionId}`);
  }
  if (subscriptionId) {
    filters.push(`dodo_subscription_id.eq.${subscriptionId}`);
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("revenue_events")
    .select("*")
    .or(filters.join(","))
    .order("received_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  const event = data ? mapRevenueEventRow(data as RevenueEventRow) : undefined;
  if (!event) {
    return undefined;
  }

  if (
    scope?.workspaceIds &&
    !scope.workspaceIds.includes(event.metadata.workspace_id)
  ) {
    return undefined;
  }

  return event;
}

export async function findRecurringRouteForSubscriptionCycle(args: {
  subscriptionId: string;
  nextBillingDate: string;
}): Promise<RevenueEvent | undefined> {
  if (!isSupabaseConfigured()) {
    return loadMemoryState().events.find(
      (event) =>
        event.dodoSubscriptionId === args.subscriptionId &&
        (event.type === "subscription.active" ||
          event.type === "subscription.renewed") &&
        event.eventContext?.nextBillingDate === args.nextBillingDate
    );
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("revenue_events")
    .select("*")
    .eq("dodo_subscription_id", args.subscriptionId)
    .in("type", ["subscription.active", "subscription.renewed"])
    .contains("event_context", { nextBillingDate: args.nextBillingDate })
    .order("received_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapRevenueEventRow(data as RevenueEventRow) : undefined;
}

export async function findActionableRouteForSubscriptionCycle(args: {
  subscriptionId: string;
  nextBillingDate: string;
}): Promise<RevenueEvent | undefined> {
  const isActionable = (event: RevenueEvent) =>
    event.dodoSubscriptionId === args.subscriptionId &&
    event.eventContext?.nextBillingDate === args.nextBillingDate &&
    (event.eventContext?.routeKind === "revenue_route" ||
      event.eventContext?.routeKind === "recurring_route");

  if (!isSupabaseConfigured()) {
    return loadMemoryState().events.find(isActionable);
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("revenue_events")
    .select("*")
    .eq("dodo_subscription_id", args.subscriptionId)
    .contains("event_context", { nextBillingDate: args.nextBillingDate })
    .order("received_at", { ascending: false })
    .limit(20);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? [])
    .map((row: unknown) => mapRevenueEventRow(row as RevenueEventRow))
    .find(isActionable);
}

export async function findLatestRevenueEventByCustomer(
  customerId: string
): Promise<RevenueEvent | undefined> {
  if (!isSupabaseConfigured()) {
    return loadMemoryState().events.find(
      (event) => event.dodoCustomerId === customerId
    );
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("revenue_events")
    .select("*")
    .eq("dodo_customer_id", customerId)
    .order("received_at", { ascending: false })
    .limit(10);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? [])
    .map((row: unknown) => mapRevenueEventRow(row as RevenueEventRow))
    .find(
      (event: RevenueEvent) =>
        event.metadata?.workspace_id &&
        event.metadata?.merchant_id &&
        event.metadata?.rule_id &&
        event.metadata?.product_tag
    );
}

export async function updateRevenueEventById(
  id: string,
  updater: (event: RevenueEvent) => RevenueEvent
): Promise<RevenueEvent | undefined> {
  if (!isSupabaseConfigured()) {
    const state = getMemoryState();
    let updatedEvent: RevenueEvent | undefined;

    state.events = state.events.map((event) => {
      if (event.id !== id) return event;
      updatedEvent = updater(event);
      return updatedEvent;
    });

    if (!updatedEvent) {
      return undefined;
    }

    const finalEvent = updatedEvent;

    state.receipts = state.receipts.map((receipt) =>
      receipt.revenueEvent.id === id
        ? {
            ...receipt,
            revenueEvent: finalEvent,
          }
        : receipt
    );

    return finalEvent;
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("revenue_events")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return undefined;
  }

  const next = updater(mapRevenueEventRow(data as RevenueEventRow));
  const { data: updatedData, error: updateError } = await supabase
    .from("revenue_events")
    .update(toRevenueEventRow(next))
    .eq("id", id)
    .select("*")
    .single();

  if (updateError) {
    throw new Error(updateError.message);
  }

  return mapRevenueEventRow(updatedData as RevenueEventRow);
}

export async function updateRevenueEventByPaymentId(
  paymentId: string,
  updater: (event: RevenueEvent) => RevenueEvent,
  scope?: EventStoreScope
): Promise<RevenueEvent | undefined> {
  const revenueEvent = await findRevenueEventByReference({ paymentId }, scope);
  if (!revenueEvent) {
    return undefined;
  }

  return updateRevenueEventById(revenueEvent.id, updater);
}

export async function getPayoutIntentById(
  id: string,
  scope?: EventStoreScope
): Promise<PayoutIntent | undefined> {
  if (!isSupabaseConfigured()) {
    return loadMemoryState().payoutIntents.find((intent) => intent.id === id);
  }

  if (scope?.workspaceIds) {
    const { payoutIntents } = await loadSupabaseState(scope);
    return payoutIntents.find((intent) => intent.id === id);
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("payout_intents")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapPayoutIntentRow(data as PayoutIntentRow) : undefined;
}

export async function updatePayoutIntent(
  id: string,
  updater: (intent: PayoutIntent) => PayoutIntent,
  scope?: EventStoreScope
): Promise<PayoutIntent | undefined> {
  if (!isSupabaseConfigured()) {
    const state = getMemoryState();
    let updatedIntent: PayoutIntent | undefined;

    state.payoutIntents = state.payoutIntents.map((intent) => {
      if (intent.id !== id) return intent;
      updatedIntent = updater(intent);
      return updatedIntent;
    });

    if (!updatedIntent) {
      return undefined;
    }

    const finalIntent = updatedIntent;
    state.receipts = state.receipts.map((receipt) => {
      if (receipt.revenueEvent.id !== finalIntent.revenueEventId) {
        return receipt;
      }

      return {
        ...receipt,
        payoutIntents: receipt.payoutIntents.map((intent) =>
          intent.id === finalIntent.id ? finalIntent : intent
        ),
      };
    });

    return finalIntent;
  }

  const current = await getPayoutIntentById(id, scope);
  if (!current) {
    return undefined;
  }

  const next = updater(current);
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("payout_intents")
    .update(toPayoutIntentRow(next))
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapPayoutIntentRow(data as PayoutIntentRow);
}

export async function updatePayoutIntentsForRevenueEvent(
  revenueEventId: string,
  updater: (intent: PayoutIntent) => PayoutIntent
): Promise<PayoutIntent[]> {
  if (!isSupabaseConfigured()) {
    const state = getMemoryState();
    const updated: PayoutIntent[] = [];

    state.payoutIntents = state.payoutIntents.map((intent) => {
      if (intent.revenueEventId !== revenueEventId) {
        return intent;
      }
      const next = updater(intent);
      updated.push(next);
      return next;
    });

    state.receipts = state.receipts.map((receipt) => {
      if (receipt.revenueEvent.id !== revenueEventId) {
        return receipt;
      }

      return {
        ...receipt,
        payoutIntents: receipt.payoutIntents.map((intent) =>
          intent.revenueEventId === revenueEventId ? updater(intent) : intent
        ),
      };
    });

    return updated;
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("payout_intents")
    .select("*")
    .eq("revenue_event_id", revenueEventId);

  if (error) {
    throw new Error(error.message);
  }

  const current = (data ?? []).map((row: unknown) =>
    mapPayoutIntentRow(row as PayoutIntentRow)
  );
  const next = current.map(updater);

  if (next.length === 0) {
    return [];
  }

  const { error: upsertError } = await supabase
    .from("payout_intents")
    .upsert(next.map(toPayoutIntentRow), { onConflict: "id" });

  if (upsertError) {
    throw new Error(upsertError.message);
  }

  return next;
}

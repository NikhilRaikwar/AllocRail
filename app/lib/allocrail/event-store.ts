import type { AllocRailReceipt, PayoutIntent, RevenueEvent } from "./types";

type EventStoreState = {
  events: RevenueEvent[];
  payoutIntents: PayoutIntent[];
  receipts: AllocRailReceipt[];
  seenWebhookIds: Set<string>;
};

const MAX_EVENTS = 50;

declare global {
  var __allocRailEventStore: EventStoreState | undefined;
}

function getState(): EventStoreState {
  if (!globalThis.__allocRailEventStore) {
    globalThis.__allocRailEventStore = {
      events: [],
      payoutIntents: [],
      receipts: [],
      seenWebhookIds: new Set<string>(),
    };
  }

  return globalThis.__allocRailEventStore;
}

export function hasSeenWebhook(webhookId: string) {
  return getState().seenWebhookIds.has(webhookId);
}

export function recordWebhookEvent(
  webhookId: string,
  event: RevenueEvent,
  payoutIntents: PayoutIntent[],
  receipt: AllocRailReceipt
) {
  const state = getState();
  state.seenWebhookIds.add(webhookId);
  state.events.unshift(event);
  state.events = state.events.slice(0, MAX_EVENTS);
  state.payoutIntents = [...payoutIntents, ...state.payoutIntents].slice(0, MAX_EVENTS * 4);
  state.receipts.unshift(receipt);
  state.receipts = state.receipts.slice(0, MAX_EVENTS);
}

export function listRecentRevenueEvents() {
  return [...getState().events];
}

export function listRecentPayoutIntents() {
  return [...getState().payoutIntents];
}

export function listRecentReceipts() {
  return [...getState().receipts];
}

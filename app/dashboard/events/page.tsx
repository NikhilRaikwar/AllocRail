import type { Metadata } from "next";
import { DashboardShell } from "@/app/components/dashboard-shell";
import { RevenueEventActions } from "@/app/components/revenue-event-actions";
import Link from "next/link";
import {
  formatMoney,
  formatTimestamp,
  getDashboardSnapshot,
  getEventRouteKind,
  getEventRouteKindLabel,
  getEventSummary,
  getReceiptSettlementLabel,
  shortId,
} from "@/app/lib/allocrail/dashboard-data";
import type { RevenueEvent } from "@/app/lib/allocrail/types";
import styles from "@/app/dashboard/dashboard.module.css";

export const metadata: Metadata = {
  title: "Revenue Events",
  description: "Inspect verified Dodo revenue events, routing metadata, and route summaries inside the founder revenue inbox.",
};

function getEventTagClass(event: RevenueEvent) {
  if (event.type.startsWith("subscription.")) {
    return styles.tagPurple;
  }

  if (event.type.startsWith("credit.")) {
    return styles.tagBlue;
  }

  return styles.tagGreen;
}

function getRouteKindClass(routeKind: ReturnType<typeof getEventRouteKind>) {
  switch (routeKind) {
    case "revenue_route":
      return styles.tagGreen;
    case "recurring_route":
      return styles.tagPurple;
    case "budget_signal":
      return styles.tagBlue;
    case "lifecycle_signal":
      return styles.tagAmber;
  }
}

function getSettlementLabel(event: RevenueEvent, statuses: string[]) {
  if (statuses.length === 0) {
    if (
      event.type === "subscription.active" &&
      event.eventContext?.summary?.includes("Linked payment already created")
    ) {
      return "state synced";
    }
    if (
      event.type === "subscription.renewed" &&
      event.eventContext?.summary?.includes("Duplicate treasury route suppressed")
    ) {
      return "state synced";
    }
    if (event.type === "credit.deducted") {
      return "budget usage";
    }
    if (event.type === "credit.added") {
      return "budget updated";
    }
    if (event.type === "credit.balance_low") {
      return "low balance";
    }
    if (event.type === "subscription.cancelled") {
      return "subscription stopped";
    }
    if (event.type === "subscription.updated") {
      return "state synced";
    }
    return "no payout route";
  }

  return getReceiptSettlementLabel(statuses);
}

function getSettlementTagClass(label: string) {
  if (label === "confirmed") return styles.tagBlue;
  if (
    label === "quarantined" ||
    label === "approval blocked" ||
    label === "subscription stopped"
  ) {
    return styles.tagRed;
  }
  if (
    label === "budget usage" ||
    label === "budget updated" ||
    label === "low balance" ||
    label === "state synced"
  ) {
    return styles.tagMuted;
  }
  return styles.tagAmber;
}

function getContextLine(event: RevenueEvent) {
  const parts: string[] = [];

  if (event.dodoPaymentId) {
    parts.push(`payment ${shortId(event.dodoPaymentId, 10, 4)}`);
  }

  if (event.dodoSubscriptionId) {
    parts.push(`subscription ${shortId(event.dodoSubscriptionId, 10, 4)}`);
  }

  if (event.creditEntitlementName) {
    parts.push(event.creditEntitlementName);
  }

  if (event.sourceReferenceType && event.sourceReferenceId) {
    parts.push(
      `${event.sourceReferenceType} ${shortId(event.sourceReferenceId, 10, 4)}`
    );
  }

  if (event.eventContext?.availableBalance) {
    parts.push(`balance ${event.eventContext.availableBalance}`);
  }

  if (event.eventContext?.nextBillingDate) {
    parts.push(`next ${formatTimestamp(event.eventContext.nextBillingDate)}`);
  }

  return parts.length > 0 ? parts.join(" · ") : "Founder review signal";
}

function isWithinDateWindow(receivedAt: string, filter: string) {
  if (!filter || filter === "all") return true;

  const now = new Date();
  const date = new Date(receivedAt);
  const msPerDay = 24 * 60 * 60 * 1000;
  const ageMs = now.getTime() - date.getTime();

  if (filter === "today") {
    return now.toISOString().slice(0, 10) === receivedAt.slice(0, 10);
  }

  if (filter === "7d") {
    return ageMs <= 7 * msPerDay;
  }

  if (filter === "30d") {
    return ageMs <= 30 * msPerDay;
  }

  return receivedAt.slice(0, 10) === filter;
}

export default async function DashboardEventsPage({
  searchParams,
}: {
  searchParams?: Promise<{
    q?: string;
    route?: string;
    type?: string;
    status?: string;
    date?: string;
  }>;
}) {
  const snapshot = await getDashboardSnapshot();
  const params = (await searchParams) ?? {};
  const query = (params.q ?? "").trim().toLowerCase();
  const routeFilter = (params.route ?? "all").trim().toLowerCase();
  const typeFilter = (params.type ?? "all").trim().toLowerCase();
  const statusFilter = (params.status ?? "all").trim().toLowerCase();
  const dateFilter = (params.date ?? "all").trim().toLowerCase();

  const rows = snapshot.events.map((event) => {
    const receipt = snapshot.receipts.find((entry) => entry.revenueEvent.id === event.id);
    const routeKind = getEventRouteKind(event);
    const settlementLabel = getSettlementLabel(
      event,
      receipt?.payoutIntents.map((intent) => intent.status) ?? []
    );

    return {
      event,
      receipt,
      routeKind,
      settlementLabel,
      summary: getEventSummary(event),
      contextLine: getContextLine(event),
    };
  });

  const uniqueTypes = Array.from(new Set(snapshot.events.map((event) => event.type)));
  const filteredRows = rows.filter((row) => {
    const haystack = [
      row.event.id,
      row.event.type,
      row.event.dodoPaymentId,
      row.event.checkoutSessionId,
      row.event.dodoSubscriptionId,
      row.event.creditEntitlementName,
      row.event.creditEntitlementId,
      row.event.dodoCustomerId,
      row.receipt?.id,
      row.summary,
      row.contextLine,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const matchesQuery = query ? haystack.includes(query) : true;
    const matchesRoute = routeFilter === "all" ? true : row.routeKind === routeFilter;
    const matchesType = typeFilter === "all" ? true : row.event.type === typeFilter;
    const matchesStatus =
      statusFilter === "all" ? true : row.settlementLabel.replaceAll(" ", "_") === statusFilter;
    const matchesDate = isWithinDateWindow(row.event.receivedAt, dateFilter);

    return matchesQuery && matchesRoute && matchesType && matchesStatus && matchesDate;
  });

  return (
    <DashboardShell title="Revenue Events">
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.eyebrow}>// revenue events</div>
          <h1 className={styles.pageTitle}>
            Dodo <em>Revenue Inbox.</em>
          </h1>
        </div>
        <div className={styles.pageActions}>
          <Link href="/api/allocrail/events?format=csv" className={styles.secondaryButton}>
            Export CSV
          </Link>
        </div>
      </div>

      <div
        className={styles.miniGrid}
        style={{ marginBottom: 18, paddingBottom: 0, borderBottom: "none" }}
      >
        <div className={styles.miniCard}>
          <div className={styles.miniLabel}>Revenue Routes</div>
          <div className={styles.statValue} style={{ fontSize: 22, color: "var(--green)", marginBottom: 0 }}>
            {snapshot.metrics.revenueRouteCount}
          </div>
        </div>
        <div className={styles.miniCard}>
          <div className={styles.miniLabel}>Recurring Routes</div>
          <div className={styles.statValue} style={{ fontSize: 22, color: "var(--purple)", marginBottom: 0 }}>
            {snapshot.metrics.recurringRouteCount}
          </div>
        </div>
        <div className={styles.miniCard}>
          <div className={styles.miniLabel}>Budget Signals</div>
          <div className={styles.statValue} style={{ fontSize: 22, color: "var(--blue)", marginBottom: 0 }}>
            {snapshot.metrics.budgetSignalCount}
          </div>
        </div>
      </div>

      <div className={styles.card} style={{ marginBottom: 18 }}>
        <div className={styles.cardHeader}>
          <div className={styles.cardTitle}>Filter Inbox</div>
          <span className={`${styles.tag} ${styles.tagBlue}`}>{filteredRows.length} visible</span>
        </div>
        <form method="get" className={styles.eventsFilterBar}>
          <input
            type="text"
            name="q"
            defaultValue={params.q ?? ""}
            placeholder="Search payment, subscription, customer, entitlement, or receipt"
            className={styles.routeFilterInput}
          />
          <select name="route" defaultValue={routeFilter} className={styles.routeFilterSelect}>
            <option value="all">All route kinds</option>
            <option value="revenue_route">Revenue routes</option>
            <option value="recurring_route">Recurring routes</option>
            <option value="budget_signal">Budget signals</option>
            <option value="lifecycle_signal">Lifecycle signals</option>
          </select>
          <select name="type" defaultValue={typeFilter} className={styles.routeFilterSelect}>
            <option value="all">All event types</option>
            {uniqueTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <select name="status" defaultValue={statusFilter} className={styles.routeFilterSelect}>
            <option value="all">All route states</option>
            <option value="confirmed">Confirmed</option>
            <option value="pending_settlement">Pending settlement</option>
            <option value="quarantined">Quarantined</option>
            <option value="approval_blocked">Approval blocked</option>
            <option value="budget_usage">Budget usage</option>
            <option value="low_balance">Low balance</option>
            <option value="subscription_stopped">Subscription stopped</option>
            <option value="state_synced">State synced</option>
            <option value="no_payout_route">No payout route</option>
          </select>
          <select name="date" defaultValue={dateFilter} className={styles.routeFilterSelect}>
            <option value="all">All dates</option>
            <option value="today">Today</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </select>
          <button type="submit" className={styles.inlineActionPrimary}>
            Apply
          </button>
          <a href="/dashboard/events" className={styles.inlineAction}>
            Reset
          </a>
        </form>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.cardTitle}>Revenue Events</div>
          <span className={`${styles.tag} ${styles.tagGreen}`}>event feed</span>
        </div>
        {filteredRows.length === 0 ? (
          <div className={styles.emptyState}>
            No Dodo events match these filters.
          </div>
        ) : (
          <div className={styles.eventList}>
            {filteredRows.map((row) => {
              const canRefund =
                Boolean(row.event.dodoPaymentId) &&
                row.settlementLabel !== "quarantined" &&
                row.event.dodoRefundStatus !== "succeeded" &&
                row.event.dodoRefundStatus !== "pending";
              const disabledLabel =
                row.event.dodoRefundId || row.event.dodoRefundStatus === "succeeded"
                  ? "Refunded"
                  : row.event.dodoRefundStatus === "pending"
                    ? "Refund pending"
                    : "Held";

              return (
                <div key={row.event.id} className={styles.eventRowCard}>
                  <div className={styles.eventRowMain}>
                    <div className={styles.eventRowHeader}>
                      <div className={styles.eventRowTagGroup}>
                        <span className={`${styles.tag} ${getEventTagClass(row.event)}`}>
                          {row.event.type}
                        </span>
                        <span className={`${styles.tag} ${getRouteKindClass(row.routeKind)}`}>
                          {getEventRouteKindLabel(row.routeKind)}
                        </span>
                        <span className={`${styles.tag} ${getSettlementTagClass(row.settlementLabel)}`}>
                          {row.settlementLabel}
                        </span>
                      </div>
                      <div className={`${styles.mono} ${styles.faint}`} style={{ fontSize: 11 }}>
                        {formatTimestamp(row.event.receivedAt)}
                      </div>
                    </div>

                    <div className={styles.eventRowSummary}>{row.summary}</div>
                    <div className={styles.eventRowContext}>{row.contextLine}</div>

                    <div className={styles.eventRowMetaGrid}>
                      <EventMeta label="Amount" value={formatMoney(row.event.amountCents, row.event.currency)} emphasize />
                      <EventMeta label="Rule" value={row.event.metadata.rule_id} />
                      <EventMeta label="Payment" value={row.event.dodoPaymentId ?? "-"} mono />
                      <EventMeta label="Subscription" value={row.event.dodoSubscriptionId ?? "-"} mono />
                      <EventMeta
                        label="Customer"
                        value={row.event.dodoCustomerId ?? row.event.eventContext?.customerId ?? "-"}
                        mono
                      />
                      <EventMeta
                        label="Entitlement"
                        value={row.event.creditEntitlementName ?? row.event.creditEntitlementId ?? "-"}
                      />
                      <EventMeta
                        label="Threshold"
                        value={
                          row.event.eventContext?.thresholdPercent != null
                            ? `${row.event.eventContext.thresholdPercent}%`
                            : row.event.eventContext?.thresholdAmount ?? "-"
                        }
                      />
                      <EventMeta
                        label="Receipt"
                        value={row.receipt ? shortId(row.receipt.id, 14, 6) : "signal only"}
                        mono
                      />
                    </div>
                  </div>

                  <div className={styles.eventRowActions}>
                    <RevenueEventActions
                      paymentId={row.event.dodoPaymentId}
                      receiptId={row.receipt?.id}
                      refundId={row.event.dodoRefundId}
                      canRefund={canRefund}
                      disabledLabel={disabledLabel}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

function EventMeta({
  label,
  value,
  mono = false,
  emphasize = false,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  emphasize?: boolean;
}) {
  return (
    <div className={styles.eventMetaCard}>
      <div className={styles.miniLabel}>{label}</div>
      <div
        className={mono ? `${styles.mono} ${styles.muted}` : styles.muted}
        style={
          emphasize
            ? {
                fontFamily: "var(--font-dashboard-serif)",
                fontStyle: "italic",
                fontSize: 17,
                color: "var(--green)",
              }
            : { fontSize: 11 }
        }
      >
        {value}
      </div>
    </div>
  );
}

import { DashboardShell } from "@/app/components/dashboard-shell";
import { PayoutIntentActions } from "@/app/components/payout-intent-actions";
import {
  formatMoney,
  formatTimestamp,
  getEventRouteKind,
  getEventRouteKindLabel,
  getDashboardSnapshot,
  shortId,
} from "@/app/lib/allocrail/dashboard-data";
import type { PayoutIntent } from "@/app/lib/allocrail/types";
import styles from "@/app/dashboard/dashboard.module.css";

function isOpenIntent(intent: PayoutIntent) {
  return (
    intent.status === "draft" ||
    intent.status === "pending_approval" ||
    intent.status === "approved" ||
    intent.status === "submitted" ||
    intent.status === "failed" ||
    intent.status === "quarantined"
  );
}

function statusLabel(intentCount: number, openCount: number, statuses: Set<string>) {
  if (statuses.has("quarantined")) return "held";
  if (statuses.has("rejected")) return "approval blocked";
  if (statuses.size === 1 && statuses.has("confirmed")) return "confirmed";
  if (openCount === 0 && intentCount > 0) return "settled";
  return "active";
}

export default async function DashboardPayoutIntentsPage({
  searchParams,
}: {
  searchParams?: Promise<{
    payment?: string;
    status?: string;
    date?: string;
  }>;
}) {
  const snapshot = await getDashboardSnapshot();
  const allocationRule = snapshot.allocationRule;
  const params = (await searchParams) ?? {};
  const paymentQuery = (params.payment ?? "").trim().toLowerCase();
  const statusFilter = (params.status ?? "all").trim().toLowerCase();
  const dateFilter = (params.date ?? "").trim();

  const groupedRoutes = snapshot.receipts
    .map((receipt) => {
      const intents = [...receipt.payoutIntents].sort((a, b) =>
        a.bucketKind.localeCompare(b.bucketKind)
      );
      const openIntents = intents.filter(isOpenIntent);
      const queuedCents = openIntents.reduce((sum, intent) => sum + intent.amountCents, 0);
      const pendingApprovals = intents.filter(
        (intent) => intent.status === "pending_approval"
      ).length;
      const statuses = new Set(intents.map((intent) => intent.status));
      const routeStatus = statusLabel(intents.length, openIntents.length, statuses);
      const routeDate = receipt.revenueEvent.receivedAt.slice(0, 10);
      const routeKind = getEventRouteKind(receipt.revenueEvent);

      return {
        receipt,
        intents,
        openIntents,
        queuedCents,
        pendingApprovals,
        routeStatus,
        routeDate,
        routeKind,
      };
    })
    .filter((group) => {
      const matchesPayment = paymentQuery
        ? (group.receipt.revenueEvent.dodoPaymentId ?? "")
            .toLowerCase()
            .includes(paymentQuery) ||
          (group.receipt.revenueEvent.checkoutSessionId ?? "")
            .toLowerCase()
            .includes(paymentQuery) ||
          group.receipt.id.toLowerCase().includes(paymentQuery)
        : true;

      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "open"
            ? group.openIntents.length > 0
            : statusFilter === "pending_approval"
              ? group.pendingApprovals > 0
              : statusFilter === "confirmed"
                ? group.routeStatus === "confirmed" || group.routeStatus === "settled"
                : statusFilter === "quarantined"
                  ? group.intents.some((intent) => intent.status === "quarantined")
                  : statusFilter === "rejected"
                    ? group.intents.some((intent) => intent.status === "rejected")
                    : group.intents.some((intent) => intent.status === statusFilter);

      const matchesDate = dateFilter ? group.routeDate === dateFilter : true;

      return matchesPayment && matchesStatus && matchesDate;
    });

  const filteredIntents = groupedRoutes.flatMap((group) => group.intents);
  const filteredOpenIntents = filteredIntents.filter(isOpenIntent);
  const filteredPendingApprovals = filteredIntents.filter(
    (intent) => intent.status === "pending_approval"
  );
  const filteredQueuedCents = filteredOpenIntents.reduce(
    (sum, intent) => sum + intent.amountCents,
    0
  );

  const uniqueDates = Array.from(
    new Set(snapshot.receipts.map((receipt) => receipt.revenueEvent.receivedAt.slice(0, 10)))
  );

  return (
    <DashboardShell title="Payout Intents">
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.eyebrow}>// payout intents</div>
          <h1 className={styles.pageTitle}>
            Treasury <em>Routes.</em>
          </h1>
        </div>
        <div className={styles.pageActions}>
          <span className={styles.secondaryButton}>Grouped by payment route</span>
        </div>
      </div>

      <div
        className={styles.miniGrid}
        style={{ marginBottom: 18, paddingBottom: 0, borderBottom: "none" }}
      >
        <div className={styles.miniCard}>
          <div className={styles.miniLabel}>Visible Intents</div>
          <div className={styles.statValue} style={{ fontSize: 22, marginBottom: 0 }}>
            {filteredOpenIntents.length}
          </div>
        </div>
        <div className={styles.miniCard}>
          <div className={styles.miniLabel}>Pending Approval</div>
          <div
            className={styles.statValue}
            style={{ fontSize: 22, color: "var(--amber)", marginBottom: 0 }}
          >
            {filteredPendingApprovals.length}
          </div>
        </div>
        <div className={styles.miniCard}>
          <div className={styles.miniLabel}>Total USDC Queued</div>
          <div
            className={styles.statValue}
            style={{ fontSize: 22, color: "var(--green)", marginBottom: 0 }}
          >
            {formatMoney(filteredQueuedCents, "USDC")}
          </div>
        </div>
      </div>

      <div className={styles.card} style={{ marginBottom: 18 }}>
        <div className={styles.cardHeader}>
          <div className={styles.cardTitle}>Filter Routes</div>
          <span className={`${styles.tag} ${styles.tagBlue}`}>{groupedRoutes.length} routes</span>
        </div>
        <form method="get" className={styles.routeFilterBar}>
          <input
            type="text"
            name="payment"
            defaultValue={params.payment ?? ""}
            placeholder="Payment ID, checkout, or receipt ID"
            className={styles.routeFilterInput}
          />
          <select
            name="status"
            defaultValue={statusFilter}
            className={styles.routeFilterSelect}
          >
            <option value="all">All statuses</option>
            <option value="open">Open routes</option>
            <option value="pending_approval">Pending approval</option>
            <option value="quarantined">Held / quarantined</option>
            <option value="rejected">Approval blocked</option>
            <option value="confirmed">Confirmed</option>
          </select>
          <select name="date" defaultValue={dateFilter} className={styles.routeFilterSelect}>
            <option value="">All dates</option>
            {uniqueDates.map((date) => (
              <option key={date} value={date}>
                {date}
              </option>
            ))}
          </select>
          <button type="submit" className={styles.inlineActionPrimary}>
            Apply
          </button>
          <a href="/dashboard/payout-intents" className={styles.inlineAction}>
            Reset
          </a>
        </form>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.cardTitle}>Routes by Payment</div>
          <span className={`${styles.tag} ${styles.tagBlue}`}>Solana devnet · USDC</span>
        </div>
        {groupedRoutes.length === 0 ? (
          <div className={styles.emptyState}>No payout routes match these filters.</div>
        ) : (
          <div className={styles.routeGroupList}>
            {groupedRoutes.map((group) => (
              <details
                key={group.receipt.id}
                className={styles.routeGroupCard}
                open={groupedRoutes.length <= 3 || group.pendingApprovals > 0}
              >
                <summary className={styles.routeGroupSummary}>
                  <div className={styles.routeGroupMeta}>
                    <div className={styles.routeGroupTitleRow}>
                      <div className={styles.routeGroupTitle}>
                        {shortId(group.receipt.revenueEvent.dodoPaymentId, 12, 5)}
                      </div>
                      <span
                        className={`${styles.tag} ${
                          group.routeKind === "revenue_route"
                            ? styles.tagGreen
                            : group.routeKind === "recurring_route"
                              ? styles.tagPurple
                              : group.routeKind === "budget_signal"
                                ? styles.tagBlue
                                : styles.tagAmber
                        }`}
                      >
                        {getEventRouteKindLabel(group.routeKind)}
                      </span>
                      <span
                        className={`${styles.tag} ${
                          group.routeStatus === "held"
                            ? styles.tagRed
                            : group.routeStatus === "approval blocked"
                              ? styles.tagRed
                              : group.routeStatus === "confirmed" ||
                                  group.routeStatus === "settled"
                                ? styles.tagBlue
                                : group.pendingApprovals > 0
                                  ? styles.tagAmber
                                  : styles.tagGreen
                        }`}
                      >
                        {group.routeStatus}
                      </span>
                    </div>
                    <div className={styles.routeGroupSubline}>
                      <span>Receipt {shortId(group.receipt.id, 14, 6)}</span>
                      <span>Checkout {shortId(group.receipt.revenueEvent.checkoutSessionId, 12, 4)}</span>
                      <span>{group.receipt.revenueEvent.type}</span>
                      <span>{formatTimestamp(group.receipt.revenueEvent.receivedAt)}</span>
                    </div>
                  </div>
                  <div className={styles.routeGroupStats}>
                    <div>
                      <div className={styles.routeGroupStatLabel}>Source</div>
                      <div className={styles.routeGroupStatValue}>
                        {formatMoney(
                          group.receipt.revenueEvent.amountCents,
                          group.receipt.revenueEvent.currency
                        )}
                      </div>
                    </div>
                    <div>
                      <div className={styles.routeGroupStatLabel}>Queued</div>
                      <div className={styles.routeGroupStatValue}>
                        {formatMoney(group.queuedCents, "USDC")}
                      </div>
                    </div>
                    <div>
                      <div className={styles.routeGroupStatLabel}>Open</div>
                      <div className={styles.routeGroupStatValue}>{group.openIntents.length}</div>
                    </div>
                  </div>
                </summary>

                <div className={styles.routeIntentTableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Bucket</th>
                        <th>Recipient Wallet</th>
                        <th>Amount (USDC)</th>
                        <th>%</th>
                        <th>Status</th>
                        <th>Approval Required</th>
                        <th>Solana Tx</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.intents.map((intent) => {
                        const bucket = group.receipt.allocationRule.buckets.find(
                          (entry) => entry.kind === intent.bucketKind
                        );
                        const dotClass =
                          intent.bucketKind === "contractor_escrow"
                            ? styles.dotGreen
                            : intent.bucketKind === "tax_reserve"
                              ? styles.dotAmber
                              : intent.bucketKind === "founder_share"
                                ? styles.dotPurple
                                : styles.dotBlue;

                        const statusTagClass =
                          intent.status === "pending_approval"
                            ? styles.tagAmber
                            : intent.status === "failed" ||
                                intent.status === "rejected" ||
                                intent.status === "quarantined"
                              ? styles.tagRed
                              : intent.status === "confirmed"
                                ? styles.tagBlue
                                : styles.tagGreen;

                        return (
                          <tr key={intent.id}>
                            <td>
                              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                                <span
                                  className={`${styles.intentDot} ${dotClass}`}
                                  style={{ width: 8, height: 8 }}
                                />
                                {bucket?.label ?? intent.bucketKind.replaceAll("_", " ")}
                              </div>
                            </td>
                            <td
                              className={`${styles.mono} ${styles.faint}`}
                              style={{ fontSize: 10 }}
                            >
                              {shortId(intent.recipientWallet, 12, 4)}
                            </td>
                            <td
                              style={{
                                fontFamily: "var(--font-dashboard-serif)",
                                fontStyle: "italic",
                                color: "var(--green)",
                                fontSize: 15,
                              }}
                            >
                              {formatMoney(intent.amountCents, intent.currency)}
                            </td>
                            <td className={`${styles.mono} ${styles.muted}`}>
                              {bucket ? Math.round(bucket.percentageBps / 100) : 0}%
                            </td>
                            <td>
                              <span className={`${styles.tag} ${statusTagClass}`}>
                                {intent.status}
                              </span>
                              {intent.approvedAt || intent.rejectedAt ? (
                                <div
                                  className={`${styles.mono} ${styles.faint}`}
                                  style={{ fontSize: 10, marginTop: 4, lineHeight: 1.4 }}
                                >
                                  {intent.approvedAt
                                    ? `approved by ${intent.approvedByName ?? "founder"}`
                                    : `rejected by ${intent.rejectedByName ?? "founder"}`}
                                </div>
                              ) : null}
                            </td>
                            <td>
                              <span
                                className={`${styles.tag} ${
                                  intent.requiresApproval ? styles.tagRed : styles.tagMuted
                                }`}
                              >
                                {intent.requiresApproval ? "Yes" : "No"}
                              </span>
                            </td>
                            <td style={{ minWidth: 180 }}>
                              {intent.solanaSignature ? (
                                <div className={styles.txCell}>
                                  <a
                                    href={intent.explorerUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={styles.explorerLink}
                                  >
                                    {shortId(intent.solanaSignature, 8, 6)}
                                  </a>
                                  <span
                                    className={`${styles.mono} ${styles.faint}`}
                                    style={{ fontSize: 10 }}
                                  >
                                    {intent.solanaCluster ?? "devnet"}
                                  </span>
                                </div>
                              ) : (
                                <PayoutIntentActions intent={intent} />
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </details>
            ))}
          </div>
        )}
        <div className={styles.footer}>
          <span className={styles.footerLabel}>bps total</span>
          <span className={styles.footerValue}>
            {allocationRule ? "10,000 OK" : "waiting for data"}
          </span>
        </div>
      </div>
    </DashboardShell>
  );
}

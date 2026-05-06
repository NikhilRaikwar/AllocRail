import { DashboardShell } from "@/app/components/dashboard-shell";
import Link from "next/link";
import {
  formatMoney,
  formatTimestamp,
  getDashboardSnapshot,
} from "@/app/lib/allocrail/dashboard-data";
import styles from "@/app/dashboard/dashboard.module.css";

export default function DashboardEventsPage() {
  const snapshot = getDashboardSnapshot();

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
          <Link
            href="/api/allocrail/events?format=csv"
            className={styles.secondaryButton}
          >
            Export CSV
          </Link>
        </div>
      </div>

      <div className={styles.miniGrid} style={{ marginBottom: 18, paddingBottom: 0, borderBottom: "none" }}>
        <div className={styles.miniCard}>
          <div className={styles.miniLabel}>Total Events</div>
          <div className={styles.statValue} style={{ fontSize: 22, color: "var(--green)", marginBottom: 0 }}>
            {snapshot.metrics.eventCount}
          </div>
        </div>
        <div className={styles.miniCard}>
          <div className={styles.miniLabel}>Latest Revenue</div>
          <div className={styles.statValue} style={{ fontSize: 22, marginBottom: 0 }}>
            {snapshot.latestEvent
              ? formatMoney(snapshot.metrics.latestAmountCents, snapshot.metrics.latestCurrency)
              : "Rs 0.00"}
          </div>
        </div>
        <div className={styles.miniCard}>
          <div className={styles.miniLabel}>Last Webhook</div>
          <div className={styles.mono} style={{ fontSize: 11, color: "var(--green)" }}>
            {snapshot.latestEvent ? formatTimestamp(snapshot.latestEvent.receivedAt) : "waiting"}
          </div>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.cardTitle}>Revenue Events</div>
          <span className={`${styles.tag} ${styles.tagGreen}`}>
            payment.succeeded x{snapshot.events.filter((event) => event.type === "payment.succeeded").length}
          </span>
        </div>
        {snapshot.events.length === 0 ? (
          <div className={styles.emptyState}>
            No real webhook events yet. Complete a checkout and replay the Dodo webhook.
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Event Type</th>
                  <th>Payment ID</th>
                  <th>Checkout Session</th>
                  <th>Amount</th>
                  <th>Currency</th>
                  <th>Rule ID</th>
                  <th>Received At</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.events.map((event) => (
                  <tr key={event.id}>
                    <td>
                      <span className={`${styles.tag} ${event.type === "subscription.active" ? styles.tagPurple : styles.tagGreen}`}>
                        {event.type}
                      </span>
                    </td>
                    <td className={`${styles.mono} ${styles.muted}`} style={{ fontSize: 11 }}>
                      {event.dodoPaymentId ?? "-"}
                    </td>
                    <td className={`${styles.mono} ${styles.muted}`} style={{ fontSize: 11 }}>
                      {event.checkoutSessionId}
                    </td>
                    <td style={{ fontFamily: "var(--font-dashboard-serif)", fontStyle: "italic", fontSize: 15 }}>
                      {formatMoney(event.amountCents, event.currency)}
                    </td>
                    <td>
                      <span className={`${styles.tag} ${styles.tagMuted}`}>{event.currency}</span>
                    </td>
                    <td className={`${styles.mono} ${styles.muted}`} style={{ fontSize: 11 }}>
                      {event.metadata.rule_id}
                    </td>
                    <td className={`${styles.mono} ${styles.faint}`} style={{ fontSize: 11 }}>
                      {formatTimestamp(event.receivedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

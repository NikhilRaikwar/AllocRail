import { DashboardShell } from "@/app/components/dashboard-shell";
import {
  formatMoney,
  getDashboardSnapshot,
  shortId,
} from "@/app/lib/allocrail/dashboard-data";
import { PayoutIntentActions } from "@/app/components/payout-intent-actions";
import styles from "@/app/dashboard/dashboard.module.css";

export default async function DashboardPayoutIntentsPage() {
  const snapshot = await getDashboardSnapshot();
  const totalQueued = snapshot.payoutIntents.reduce(
    (sum, intent) => sum + intent.amountCents,
    0
  );
  const allocationRule = snapshot.allocationRule;

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
          <span className={styles.secondaryButton}>
            Milestone 5 settlement flow
          </span>
        </div>
      </div>

      <div
        className={styles.miniGrid}
        style={{ marginBottom: 18, paddingBottom: 0, borderBottom: "none" }}
      >
        <div className={styles.miniCard}>
          <div className={styles.miniLabel}>Total Intents</div>
          <div
            className={styles.statValue}
            style={{ fontSize: 22, marginBottom: 0 }}
          >
            {snapshot.metrics.payoutIntentCount}
          </div>
        </div>
        <div className={styles.miniCard}>
          <div className={styles.miniLabel}>Pending Approval</div>
          <div
            className={styles.statValue}
            style={{
              fontSize: 22,
              color: "var(--amber)",
              marginBottom: 0,
            }}
          >
            {snapshot.metrics.pendingApprovalCount}
          </div>
        </div>
        <div className={styles.miniCard}>
          <div className={styles.miniLabel}>Total USDC Queued</div>
          <div
            className={styles.statValue}
            style={{
              fontSize: 22,
              color: "var(--green)",
              marginBottom: 0,
            }}
          >
            {formatMoney(totalQueued, "USDC")}
          </div>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.cardTitle}>All Payout Intents</div>
          <span className={`${styles.tag} ${styles.tagBlue}`}>
            Solana devnet · USDC
          </span>
        </div>
        {snapshot.payoutIntents.length === 0 ? (
          <div className={styles.emptyState}>No payout intents yet.</div>
        ) : (
          <div className={styles.tableWrap}>
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
                {snapshot.payoutIntents.map((intent) => {
                  const bucket = allocationRule?.buckets.find(
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
                        <span
                          className={`${styles.tag} ${
                            intent.status === "pending_approval"
                              ? styles.tagAmber
                              : intent.status === "failed"
                                ? styles.tagRed
                                : intent.status === "confirmed"
                                  ? styles.tagBlue
                                  : styles.tagGreen
                          }`}
                        >
                          {intent.status}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`${styles.tag} ${
                            intent.requiresApproval
                              ? styles.tagRed
                              : styles.tagMuted
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

import { DashboardShell } from "@/app/components/dashboard-shell";
import { formatMoney, formatTimestamp, getDashboardSnapshot } from "@/app/lib/allocrail/dashboard-data";
import styles from "@/app/dashboard/dashboard.module.css";

export default function DashboardReceiptsPage() {
  const snapshot = getDashboardSnapshot();

  return (
    <DashboardShell title="Receipts">
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.eyebrow}>// receipts</div>
          <h1 className={styles.pageTitle}>
            Audit <em>Snapshots.</em>
          </h1>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.cardTitle}>Receipt History</div>
          <span className={`${styles.tag} ${styles.tagMuted}`}>Dodo + Solana linked</span>
        </div>
        <div className={styles.cardBodyFlush}>
          {snapshot.receipts.length === 0 ? (
            <div className={styles.emptyState}>No receipts yet. They will appear after a real webhook creates a stored route snapshot.</div>
          ) : (
            snapshot.receipts.map((receipt) => (
              <div className={styles.receiptRow} key={receipt.id}>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 8,
                    border: "1px solid var(--border-strong)",
                    background: "var(--cream-dark)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 14,
                    flexShrink: 0,
                  }}
                >
                  ◈
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className={styles.mono} style={{ fontSize: 11, color: "var(--ink-muted)", marginBottom: 3 }}>
                    {receipt.id}
                  </div>
                  <div style={{ fontSize: 12.5, fontWeight: 500, marginBottom: 4 }}>
                    {receipt.revenueEvent.type} {"->"} {receipt.allocationRule.name}
                  </div>
                  <div className={styles.mono} style={{ fontSize: 10, color: "var(--ink-faint)" }}>
                    {receipt.payoutIntents.length} intents · {receipt.revenueEvent.dodoPaymentId ?? "-"} ·{" "}
                    {receipt.revenueEvent.checkoutSessionId} · Solana: pending settlement
                  </div>
                </div>
                <div style={{ flexShrink: 0, textAlign: "right", minWidth: 140 }}>
                  <div className={styles.statValue} style={{ fontSize: 15, color: "var(--green)", marginBottom: 0 }}>
                    {formatMoney(
                      receipt.payoutIntents.reduce((sum, intent) => sum + intent.amountCents, 0),
                      "USDC"
                    )}
                  </div>
                  <div className={styles.mono} style={{ fontSize: 10, color: "var(--ink-faint)", marginTop: 3 }}>
                    {formatTimestamp(receipt.revenueEvent.receivedAt)}
                  </div>
                  <a
                    href="https://explorer.solana.com/?cluster=devnet"
                    target="_blank"
                    rel="noreferrer"
                    className={styles.explorerLink}
                    style={{ fontSize: 10 }}
                  >
                    devnet explorer
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardShell>
  );
}

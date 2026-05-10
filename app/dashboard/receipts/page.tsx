import { DashboardShell } from "@/app/components/dashboard-shell";
import {
  formatMoney,
  formatTimestamp,
  getDashboardSnapshot,
} from "@/app/lib/allocrail/dashboard-data";
import styles from "@/app/dashboard/dashboard.module.css";

export default async function DashboardReceiptsPage() {
  const snapshot = await getDashboardSnapshot();

  return (
    <DashboardShell title="Receipts">
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.eyebrow}>Receipts</div>
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
            <div className={styles.emptyState}>
              No receipts yet. They will appear after a real webhook creates a
              stored route snapshot.
            </div>
          ) : (
            snapshot.receipts.map((receipt) => {
              const settlementLabel = receipt.payoutIntents.every(
                (intent) => intent.status === "confirmed"
              )
                ? "confirmed"
                : receipt.payoutIntents.some(
                      (intent) => intent.status === "quarantined"
                    )
                  ? "quarantined"
                  : receipt.payoutIntents.some((intent) => intent.status === "failed")
                    ? "partial failure"
                    : receipt.payoutIntents.some((intent) => intent.status === "submitted")
                      ? "submitting"
                      : receipt.payoutIntents.some(
                            (intent) => intent.status === "rejected"
                          )
                        ? "approval blocked"
                        : "pending settlement";

              const settlementCount = receipt.payoutIntents.filter(
                (intent) => intent.explorerUrl
              ).length;
              const settledTotal = receipt.payoutIntents.reduce(
                (sum, intent) => sum + intent.amountCents,
                0
              );
              const statusTagClass =
                settlementLabel === "confirmed"
                  ? styles.tagGreen
                  : settlementLabel === "quarantined" ||
                      settlementLabel === "approval blocked" ||
                      settlementLabel === "partial failure"
                    ? styles.tagRed
                    : styles.tagAmber;

              return (
                <div className={styles.receiptRow} key={receipt.id}>
                  <div className={styles.receiptBadge} aria-hidden="true">
                    {"\u25C8"}
                  </div>
                  <div className={styles.receiptMain}>
                    <div className={`${styles.mono} ${styles.receiptId}`}>{receipt.id}</div>
                    <div className={styles.receiptTitleRow}>
                      <div className={styles.receiptTitle}>
                        {receipt.revenueEvent.type} {"->"} {receipt.allocationRule.name}
                      </div>
                      <span className={`${styles.tag} ${statusTagClass}`}>{settlementLabel}</span>
                    </div>
                    <div className={`${styles.mono} ${styles.receiptContext}`}>
                      {receipt.payoutIntents.length} intents {"·"}{" "}
                      {receipt.revenueEvent.dodoPaymentId ?? "-"} {"·"}{" "}
                      {receipt.revenueEvent.checkoutSessionId} {"·"} Solana proof{" "}
                      {settlementCount > 0 ? "attached" : "waiting"}
                    </div>
                    <div className={`${styles.mono} ${styles.receiptSourceLine}`}>
                      source:{" "}
                      {formatMoney(
                        receipt.revenueEvent.amountCents,
                        receipt.revenueEvent.currency
                      )}
                    </div>
                  </div>
                  <div className={styles.receiptAmountBlock}>
                    <div className={styles.receiptPrimaryAmount}>
                      {formatMoney(settledTotal, "USDC")}
                    </div>
                    <div className={`${styles.mono} ${styles.receiptMetaLine}`}>
                      {formatTimestamp(receipt.revenueEvent.receivedAt)}
                    </div>
                    <a
                      href={`/dashboard/receipts/${receipt.id}`}
                      className={styles.proofLink}
                    >
                      {settlementCount > 0
                        ? `open proof · ${settlementCount} settlement${
                            settlementCount === 1 ? "" : "s"
                          }`
                        : "open proof"}
                    </a>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </DashboardShell>
  );
}

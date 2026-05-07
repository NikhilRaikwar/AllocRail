import { DashboardShell } from "@/app/components/dashboard-shell";
import {
  formatMoney,
  getDashboardSnapshot,
  shortId,
} from "@/app/lib/allocrail/dashboard-data";
import styles from "@/app/dashboard/dashboard.module.css";

export default async function DashboardRulesPage() {
  const snapshot = await getDashboardSnapshot();
  const rules = snapshot.allocationRules;
  const primaryRule = rules[0] ?? null;

  return (
    <DashboardShell title="Allocation Rules">
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.eyebrow}>// allocation rules</div>
          <h1 className={styles.pageTitle}>
            Treasury <em>Rules.</em>
          </h1>
        </div>
        <div className={styles.pageActions}>
          <button className={styles.primaryButton}>New Rule</button>
        </div>
      </div>

      <div
        className={styles.miniGrid}
        style={{ marginBottom: 18, paddingBottom: 0, borderBottom: "none" }}
      >
        <div className={styles.miniCard}>
          <div className={styles.miniLabel}>Active Rules</div>
          <div
            className={styles.statValue}
            style={{
              fontSize: 22,
              color: "var(--green)",
              marginBottom: 0,
            }}
          >
            {rules.filter((rule) => rule.enabled).length}
          </div>
        </div>
        <div className={styles.miniCard}>
          <div className={styles.miniLabel}>Total Buckets</div>
          <div
            className={styles.statValue}
            style={{ fontSize: 22, marginBottom: 0 }}
          >
            {rules.reduce((sum, rule) => sum + rule.buckets.length, 0)}
          </div>
        </div>
        <div className={styles.miniCard}>
          <div className={styles.miniLabel}>Daily Limit</div>
          <div
            className={styles.statValue}
            style={{
              fontSize: 22,
              color: "var(--green)",
              marginBottom: 0,
            }}
          >
            {primaryRule
              ? formatMoney(primaryRule.dailyLimitCents, "USD")
              : "Rs 0.00"}
          </div>
        </div>
      </div>

      <div className={styles.card}>
        {rules.length > 0 ? (
          <>
            {rules.map((rule) => (
              <div key={rule.id}>
                <div className={styles.cardHeader}>
                  <div>
                    <div className={styles.cardEyebrow}>{rule.id}</div>
                    <div className={styles.cardTitle}>{rule.name}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <span
                      className={`${styles.tag} ${
                        rule.enabled ? styles.tagGreen : styles.tagMuted
                      }`}
                    >
                      {rule.enabled ? "enabled" : "disabled"}
                    </span>
                    <button
                      className={styles.secondaryButton}
                      style={{ fontSize: 11, padding: "5px 12px" }}
                    >
                      Edit
                    </button>
                  </div>
                </div>
                <div className={styles.cardBody}>
                  <div className={styles.miniGrid}>
                    <div>
                      <div className={styles.miniLabel}>Workspace</div>
                      <div className={styles.mono} style={{ fontSize: 11 }}>
                        {rule.workspaceId}
                      </div>
                    </div>
                    <div>
                      <div className={styles.miniLabel}>Merchant</div>
                      <div className={styles.mono} style={{ fontSize: 11 }}>
                        {rule.merchantId}
                      </div>
                    </div>
                    <div>
                      <div className={styles.miniLabel}>Product Tag</div>
                      <div className={styles.mono} style={{ fontSize: 11 }}>
                        {rule.productTag}
                      </div>
                    </div>
                  </div>

                  <div className={styles.miniLabel} style={{ marginBottom: 12 }}>
                    Allocation Buckets
                  </div>
                  <div className={styles.tableWrap}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Bucket</th>
                          <th>Recipient Wallet</th>
                          <th>Basis Points</th>
                          <th>%</th>
                          <th>Approval Required</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rule.buckets.map((bucket) => {
                          const dotClass =
                            bucket.kind === "contractor_escrow"
                              ? styles.dotGreen
                              : bucket.kind === "tax_reserve"
                                ? styles.dotAmber
                                : bucket.kind === "founder_share"
                                  ? styles.dotPurple
                                  : styles.dotBlue;

                          return (
                            <tr key={`${rule.id}-${bucket.kind}`}>
                              <td>
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 7,
                                  }}
                                >
                                  <span
                                    className={`${styles.intentDot} ${dotClass}`}
                                    style={{ width: 8, height: 8 }}
                                  />
                                  {bucket.label}
                                </div>
                              </td>
                              <td
                                className={`${styles.mono} ${styles.faint}`}
                                style={{ fontSize: 10 }}
                              >
                                {shortId(bucket.recipientWallet, 12, 4)}
                              </td>
                              <td
                                className={styles.mono}
                                style={{ color: "var(--green)" }}
                              >
                                {bucket.percentageBps}
                              </td>
                              <td className={`${styles.mono} ${styles.muted}`}>
                                {Math.round(bucket.percentageBps / 100)}%
                              </td>
                              <td>
                                <span
                                  className={`${styles.tag} ${
                                    bucket.requiresApproval
                                      ? styles.tagRed
                                      : styles.tagMuted
                                  }`}
                                >
                                  {bucket.requiresApproval ? "Yes" : "No"}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className={styles.footer}>
                  <span className={styles.footerLabel}>total bps</span>
                  <span className={styles.footerValue}>10,000 / 10,000 OK</span>
                </div>
              </div>
            ))}
          </>
        ) : (
          <div className={styles.emptyState}>
            No live rules yet. Seed the Supabase schema or receive a real webhook
            to persist your first allocation rule.
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

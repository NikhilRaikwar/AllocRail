import { DashboardShell } from "@/app/components/dashboard-shell";
import {
  formatMoney,
  formatTimestamp,
  getDashboardSnapshot,
  shortId,
} from "@/app/lib/allocrail/dashboard-data";
import styles from "@/app/dashboard/dashboard.module.css";

export default async function DashboardOverviewPage() {
  const snapshot = await getDashboardSnapshot();
  const latestEvent = snapshot.latestEvent;
  const latestReceipt = snapshot.latestReceipt;
  const allocationRule = snapshot.allocationRule;

  return (
    <DashboardShell title="Overview">
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.eyebrow}>// overview</div>
          <h1 className={styles.pageTitle}>
            Treasury <em>at a glance.</em>
          </h1>
        </div>
        <div className={styles.pageActions}>
          <a href="/dashboard/events" className={styles.secondaryButton}>
            Events
          </a>
          <a href="/dashboard/payout-intents" className={styles.primaryButton}>
            Settlement Queue
          </a>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>
            <span
              className={styles.statLabelDot}
              style={{ background: "var(--green)" }}
            />
            Revenue Processed
          </div>
          <div className={styles.statValue} style={{ color: "var(--green)" }}>
            {snapshot.metrics.eventCount > 0
              ? formatMoney(
                  snapshot.metrics.totalProcessedCents,
                  snapshot.metrics.totalProcessedCurrency
                )
              : "Rs 0.00"}
          </div>
          <div className={styles.statSub}>{snapshot.metrics.eventCount} events</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}>
            <span
              className={styles.statLabelDot}
              style={{ background: "var(--amber)" }}
            />
            Pending Intents
          </div>
          <div className={styles.statValue} style={{ color: "var(--amber)" }}>
            {snapshot.metrics.activeIntentCount}
          </div>
          <div className={styles.statSub}>
            {snapshot.metrics.latestReceiptPendingApprovalCount} require approval
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}>
            <span
              className={styles.statLabelDot}
              style={{ background: "var(--blue)" }}
            />
            Webhook Status
          </div>
          <div className={styles.statValue} style={{ color: "var(--blue)" }}>
            {snapshot.webhookReady ? "Ready" : "Missing"}
          </div>
          <div className={styles.statSub}>Dodo signature check</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}>
            <span
              className={styles.statLabelDot}
              style={{ background: "var(--purple)" }}
            />
            Receipts Generated
          </div>
          <div className={styles.statValue} style={{ color: "var(--purple)" }}>
            {snapshot.metrics.receiptCount}
          </div>
          <div className={styles.statSub}>stored route snapshots</div>
        </div>
      </div>

      <div className={styles.contentGrid}>
        <div className={styles.stack}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <div className={styles.cardEyebrow}>latest event</div>
                <div className={styles.cardTitle}>Verified Revenue Event</div>
              </div>
              {latestEvent ? (
                <span className={`${styles.tag} ${styles.tagGreen}`}>
                  {latestEvent.type}
                </span>
              ) : (
                <span className={`${styles.tag} ${styles.tagMuted}`}>waiting</span>
              )}
            </div>
            <div className={styles.cardBody}>
              {latestEvent && allocationRule ? (
                <>
                  <div className={styles.overviewGrid}>
                    <InfoBlock
                      label="Payment ID"
                      value={latestEvent.dodoPaymentId}
                    />
                    <InfoBlock
                      label="Checkout Session"
                      value={latestEvent.checkoutSessionId}
                    />
                    <div>
                      <div className={styles.miniLabel}>Amount</div>
                      <div
                        className={styles.statValue}
                        style={{
                          fontSize: 20,
                          marginBottom: 0,
                          color: "var(--green)",
                        }}
                      >
                        {formatMoney(
                          latestEvent.amountCents,
                          latestEvent.currency
                        )}
                      </div>
                    </div>
                    <InfoBlock label="Rule Used" value={allocationRule.id} />
                    <InfoBlock
                      label="Received At"
                      value={formatTimestamp(latestEvent.receivedAt)}
                    />
                    <div>
                      <div className={styles.miniLabel}>Webhook Status</div>
                      <div
                        style={{ display: "flex", alignItems: "center", gap: 6 }}
                      >
                        <span
                          className={styles.pip}
                          style={{ width: 6, height: 6 }}
                        />
                        <span className={`${styles.tag} ${styles.tagGreen}`}>
                          verified
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16 }}>
                    <div className={styles.miniLabel} style={{ marginBottom: 12 }}>
                      Allocation Breakdown
                    </div>
                    {snapshot.latestReceiptBucketSummaries.map((bucket) => {
                      const percent = Math.round(bucket.percentageBps / 100);
                      const colorMap: Record<string, string> = {
                        contractor_escrow: "var(--green)",
                        tax_reserve: "var(--amber)",
                        founder_share: "var(--purple)",
                        agent_budget: "var(--blue)",
                      };
                      const barClassMap: Record<string, string> = {
                        contractor_escrow: styles.barGreen,
                        tax_reserve: styles.barAmber,
                        founder_share: styles.barPurple,
                        agent_budget: styles.barBlue,
                      };
                      const dotClassMap: Record<string, string> = {
                        contractor_escrow: styles.dotGreen,
                        tax_reserve: styles.dotAmber,
                        founder_share: styles.dotPurple,
                        agent_budget: styles.dotBlue,
                      };

                      return (
                        <div className={styles.allocSection} key={bucket.kind}>
                          <div className={styles.allocRowHeader}>
                            <div className={styles.allocNameRow}>
                              <span
                                className={`${styles.intentDot} ${dotClassMap[bucket.kind]}`}
                              />
                              <div className={styles.allocName}>{bucket.label}</div>
                            </div>
                            <span
                              className={styles.allocPct}
                              style={{ color: colorMap[bucket.kind] }}
                            >
                              {percent}% · {formatMoney(bucket.amountCents, "USDC")}
                            </span>
                          </div>
                          <div className={styles.barTrack}>
                            <div
                              className={`${styles.barFill} ${barClassMap[bucket.kind]}`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className={styles.emptyState}>
                  No real revenue event yet. Complete a Dodo checkout and replay
                  the webhook.
                </div>
              )}
            </div>
            <div className={styles.footer}>
              <span className={styles.footerLabel}>total bps validated</span>
              <span className={styles.footerValue}>
                {allocationRule ? "10,000 / 10,000 OK" : "waiting for data"}
              </span>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <div className={styles.cardEyebrow}>pending route</div>
                <div className={styles.cardTitle}>Payout Intents</div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <span className={`${styles.tag} ${styles.tagAmber}`}>
                  {snapshot.metrics.latestReceiptPendingApprovalCount} need approval
                </span>
                <LinkButton href="/dashboard/payout-intents">View all</LinkButton>
              </div>
            </div>
            <div className={styles.cardBodyFlush}>
              {snapshot.payoutIntents.length > 0 ? (
                (latestReceipt?.payoutIntents ?? []).map((intent) => {
                  const ruleBucket = allocationRule?.buckets.find(
                    (bucket) => bucket.kind === intent.bucketKind
                  );
                  const percent = ruleBucket
                    ? Math.round(ruleBucket.percentageBps / 100)
                    : 0;
                  const colorClass =
                    intent.bucketKind === "contractor_escrow"
                      ? styles.dotGreen
                      : intent.bucketKind === "tax_reserve"
                        ? styles.dotAmber
                        : intent.bucketKind === "founder_share"
                          ? styles.dotPurple
                          : styles.dotBlue;

                  return (
                    <div className={styles.intentRow} key={intent.id}>
                      <span className={`${styles.intentDot} ${colorClass}`} />
                      <div className={styles.intentInfo}>
                        <div className={styles.intentLabel}>
                          {ruleBucket?.label ??
                            intent.bucketKind.replaceAll("_", " ")}
                        </div>
                        <div className={styles.intentWallet}>
                          {shortId(intent.recipientWallet, 10, 4)}
                        </div>
                      </div>
                      <div className={styles.intentAmount}>
                        <div className={styles.intentUsdc}>
                          {formatMoney(intent.amountCents, intent.currency)}
                        </div>
                        <div className={styles.intentSmall}>{percent}%</div>
                      </div>
                      <div>
                        <span
                          className={`${styles.tag} ${
                            intent.status === "pending_approval"
                              ? styles.tagAmber
                              : intent.status === "failed" ||
                                  intent.status === "rejected" ||
                                  intent.status === "quarantined"
                                ? styles.tagRed
                                : intent.status === "confirmed"
                                  ? styles.tagBlue
                                  : styles.tagGreen
                          }`}
                        >
                          {intent.status}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className={styles.emptyState}>No payout intents yet.</div>
              )}
            </div>
            <div className={styles.footer}>
              <span className={styles.footerLabel}>settlement currency</span>
              <span className={styles.footerValue}>USDC · Solana devnet</span>
            </div>
          </div>
        </div>

        <div className={styles.stack}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <div className={styles.cardEyebrow}>dodo webhooks</div>
                <div className={styles.cardTitle}>Event Feed</div>
              </div>
              <span className={`${styles.tag} ${styles.tagGreen}`}>live</span>
            </div>
            <div className={styles.cardBodyFlush}>
              {snapshot.events.length > 0 ? (
                snapshot.events.slice(0, 3).map((event, index) => (
                  <div className={styles.whItem} key={event.id}>
                    <span className={styles.whTypePill}>{event.type}</span>
                    <div className={styles.whDetails}>
                      <div className={styles.whId}>{shortId(event.id, 10, 4)}</div>
                      <div className={styles.whRule}>{event.metadata.rule_id}</div>
                    </div>
                    <span className={styles.whTime}>
                      {index === 0 ? "latest" : `${index} old`}
                    </span>
                  </div>
                ))
              ) : (
                <div className={styles.emptyState}>No webhooks received yet.</div>
              )}
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <div className={styles.cardEyebrow}>active rule</div>
                <div className={styles.cardTitle}>
                  {allocationRule?.name ?? "No live rule yet"}
                </div>
              </div>
              <span
                className={`${styles.tag} ${
                  allocationRule ? styles.tagGreen : styles.tagMuted
                }`}
              >
                {allocationRule ? "enabled" : "waiting"}
              </span>
            </div>
            <div className={styles.cardBody}>
              {allocationRule ? (
                <>
                  <div className={styles.miniLabel} style={{ marginBottom: 8 }}>
                    {allocationRule.id}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                      marginBottom: 14,
                    }}
                  >
                    <DataPair label="Workspace" value={allocationRule.workspaceId} />
                    <DataPair label="Merchant" value={allocationRule.merchantId} />
                    <DataPair
                      label="Product tag"
                      value={allocationRule.productTag ?? "n/a"}
                    />
                    <DataPair
                      label="Daily limit"
                      value={formatMoney(allocationRule.dailyLimitCents, "USD")}
                      emphasize
                    />
                  </div>
                </>
              ) : (
                <div className={styles.emptyState}>No matched rule yet.</div>
              )}
            </div>
            <div className={styles.footer}>
              <span className={styles.footerLabel}>buckets</span>
              <span className={styles.footerValue}>
                {allocationRule
                  ? `${allocationRule.buckets.length} configured`
                  : "waiting for data"}
              </span>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <div className={styles.cardEyebrow}>latest receipt</div>
                <div className={styles.cardTitle}>Audit Snapshot</div>
              </div>
              <LinkButton href="/dashboard/receipts">View</LinkButton>
            </div>
            <div className={styles.cardBody}>
              {latestReceipt ? (
                <>
                  <div
                    className={styles.mono}
                    style={{
                      fontSize: 11,
                      marginBottom: 10,
                      color: "var(--ink-muted)",
                    }}
                  >
                    {latestReceipt.id}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                    <DataPair
                      label="Dodo event"
                      value={
                        <span className={`${styles.tag} ${styles.tagGreen}`}>
                          {latestReceipt.revenueEvent.type}
                        </span>
                      }
                    />
                    <DataPair
                      label="Intents"
                      value={`${latestReceipt.payoutIntents.length} generated`}
                    />
                    <DataPair
                      label="Solana settlement"
                      value={
                        <span
                          className={`${styles.tag} ${
                            latestReceipt.payoutIntents.some(
                              (intent) => intent.status === "quarantined"
                            )
                              ? styles.tagRed
                              : latestReceipt.payoutIntents.every(
                                    (intent) => intent.status === "confirmed"
                                  )
                                ? styles.tagBlue
                                : latestReceipt.payoutIntents.some(
                                      (intent) => intent.status === "confirmed"
                                    )
                                  ? styles.tagAmber
                                  : styles.tagMuted
                          }`}
                        >
                          {latestReceipt.payoutIntents.some(
                            (intent) => intent.status === "quarantined"
                          )
                            ? "quarantined"
                            : latestReceipt.payoutIntents.every(
                              (intent) => intent.status === "confirmed"
                            )
                              ? "confirmed"
                            : latestReceipt.payoutIntents.some(
                                  (intent) => intent.status === "rejected"
                                )
                              ? "approval blocked"
                            : latestReceipt.payoutIntents.some(
                                  (intent) => intent.status === "confirmed"
                                )
                              ? "partial"
                              : "pending"}
                        </span>
                      }
                    />
                    <DataPair
                      label="Explorer"
                      value={
                        latestReceipt.payoutIntents.find(
                          (intent) => intent.explorerUrl
                        ) ? (
                          <a
                            href={
                              latestReceipt.payoutIntents.find(
                                (intent) => intent.explorerUrl
                              )?.explorerUrl
                            }
                            target="_blank"
                            rel="noreferrer"
                            className={styles.explorerLink}
                          >
                            latest tx
                          </a>
                        ) : (
                          "waiting"
                        )
                      }
                    />
                  </div>
                </>
              ) : (
                <div className={styles.emptyState}>No receipt snapshot yet.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

function LinkButton({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a href={href} className={styles.secondaryButton}>
      {children}
    </a>
  );
}

function InfoBlock({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className={styles.miniLabel}>{label}</div>
      <div className={`${styles.mono} ${styles.muted}`} style={{ fontSize: 11 }}>
        {value}
      </div>
    </div>
  );
}

function DataPair({
  label,
  value,
  emphasize = false,
}: {
  label: string;
  value: React.ReactNode;
  emphasize?: boolean;
}) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
      <span className={styles.muted}>{label}</span>
      <span
        className={styles.mono}
        style={emphasize ? { color: "var(--green)" } : undefined}
      >
        {value}
      </span>
    </div>
  );
}

import { DashboardShell } from "@/app/components/dashboard-shell";
import { TreasuryCopilotCard } from "@/app/components/treasury-copilot-card";
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
          <div className={styles.eyebrow}>Overview</div>
          <h1 className={styles.pageTitle}>
            Treasury <em>at a glance.</em>
          </h1>
        </div>
        <div className={styles.pageActions}>
          {snapshot.seededDemo ? (
            <span className={`${styles.tag} ${styles.tagBlue}`}>Demo data loaded</span>
          ) : null}
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
            <span className={styles.statLabelDot} style={{ background: "var(--green)" }} />
            Revenue Processed
          </div>
          {snapshot.metrics.processedTotalsByCurrency.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 8 }}>
              {snapshot.metrics.processedTotalsByCurrency.map((entry, index) => (
                <div key={entry.currency}>
                  <div
                    className={styles.statValue}
                    style={{
                      color: index === 0 ? "var(--green)" : "var(--ink)",
                      fontSize: index === 0 ? 28 : 22,
                      marginBottom: 2,
                    }}
                  >
                    {formatMoney(entry.totalCents, entry.currency)}
                  </div>
                  <div className={styles.statSub}>{entry.currency} | {entry.eventCount} events</div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.statValue} style={{ color: "var(--green)" }}>
              {formatMoney(0, "INR")}
            </div>
          )}
          <div className={styles.statSub}>{snapshot.metrics.revenueRouteCount} one-time routes</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}>
            <span className={styles.statLabelDot} style={{ background: "var(--purple)" }} />
            Recurring Routes
          </div>
          <div className={styles.statValue} style={{ color: "var(--purple)" }}>
            {snapshot.metrics.recurringRouteCount}
          </div>
          <div className={styles.statSub}>subscription cycles with payout routes</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}>
            <span className={styles.statLabelDot} style={{ background: "var(--blue)" }} />
            Budget Signals
          </div>
          <div className={styles.statValue} style={{ color: "var(--blue)" }}>
            {snapshot.metrics.budgetSignalCount}
          </div>
          <div className={styles.statSub}>credits added, used, low balance</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}>
            <span className={styles.statLabelDot} style={{ background: "var(--amber)" }} />
            Pending Intents
          </div>
          <div className={styles.statValue} style={{ color: "var(--amber)" }}>
            {snapshot.metrics.activeIntentCount}
          </div>
          <div className={styles.statSub}>
            {snapshot.metrics.latestReceiptPendingApprovalCount} require approval
          </div>
        </div>
      </div>

      <div className={styles.demoStoryCard}>
        <div className={styles.demoStoryHeader}>
          <div>
            <div className={styles.cardEyebrow}>judge demo path</div>
            <div className={styles.demoStoryTitle}>One founder workflow from revenue to receipt.</div>
            {snapshot.seededDemo ? (
              <div className={styles.statSub} style={{ marginTop: 8 }}>
                Demo mode is preloaded so judges see a realistic treasury route on first load.
              </div>
            ) : null}
          </div>
          <div className={styles.demoStoryActions}>
            <a href="/dashboard/payout-intents" className={styles.primaryButton}>
              Review queue
            </a>
            <a href="/dashboard/receipts" className={styles.secondaryButton}>
              Open receipts
            </a>
          </div>
        </div>
        <div className={styles.demoStorySteps}>
          <DemoStep
            toneClass={styles.stepGreen}
            step="1"
            title="Dodo confirms revenue"
            body="A verified payment event arrives with the routing metadata that matches the founder rule."
          />
          <DemoStep
            toneClass={styles.stepPurple}
            step="2"
            title="AllocRail creates one route"
            body="The billing cycle becomes one actionable payout route instead of a noisy subscription event cluster."
          />
          <DemoStep
            toneClass={styles.stepAmber}
            step="3"
            title="Founder approves sensitive buckets"
            body="Contractor and agent-budget intents wait for approval, while refund and dispute signals can still hold the route."
          />
          <DemoStep
            toneClass={styles.stepBlue}
            step="4"
            title="Solana settles and receipt proves it"
            body="Execution is wallet-signed from the bound treasury operator wallet and recorded in a receipt-linked audit trail."
          />
        </div>
      </div>

      <div className={styles.contentGrid}>
        <div className={styles.stack}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <div className={styles.cardEyebrow}>latest event</div>
                <div className={styles.cardTitle}>Latest Dodo Event</div>
              </div>
              {latestEvent ? (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <span
                    className={`${styles.tag} ${
                      latestEvent.type.startsWith("subscription.")
                        ? styles.tagPurple
                        : latestEvent.type.startsWith("credit.")
                          ? styles.tagBlue
                          : styles.tagGreen
                    }`}
                  >
                    {latestEvent.type}
                  </span>
                  <span
                    className={`${styles.tag} ${
                      getEventRouteKind(latestEvent) === "revenue_route"
                        ? styles.tagGreen
                        : getEventRouteKind(latestEvent) === "recurring_route"
                          ? styles.tagPurple
                          : getEventRouteKind(latestEvent) === "budget_signal"
                            ? styles.tagBlue
                            : styles.tagAmber
                    }`}
                  >
                    {getEventRouteKindLabel(getEventRouteKind(latestEvent))}
                  </span>
                </div>
              ) : (
                <span className={`${styles.tag} ${styles.tagMuted}`}>waiting</span>
              )}
            </div>
            <div className={styles.cardBody}>
              {latestEvent ? (
                <>
                  <div className={styles.overviewGrid}>
                    <InfoBlock label="Payment ID" value={latestEvent.dodoPaymentId ?? "-"} />
                    <InfoBlock label="Subscription" value={latestEvent.dodoSubscriptionId ?? "-"} />
                    <div>
                      <div className={styles.miniLabel}>Amount</div>
                      <div
                        className={styles.statValue}
                        style={{ fontSize: 20, marginBottom: 0, color: "var(--green)" }}
                      >
                        {formatMoney(latestEvent.amountCents, latestEvent.currency)}
                      </div>
                    </div>
                    <InfoBlock
                      label="Route Kind"
                      value={getEventRouteKindLabel(getEventRouteKind(latestEvent))}
                    />
                    <InfoBlock label="Received At" value={formatTimestamp(latestEvent.receivedAt)} />
                    <InfoBlock
                      label="Context"
                      value={
                        latestEvent.creditEntitlementName ??
                        latestEvent.eventContext?.subscriptionStatus ??
                        latestEvent.checkoutSessionId ??
                        "-"
                      }
                    />
                  </div>

                  <div className={styles.infoPanel} style={{ marginBottom: latestReceipt ? 16 : 0 }}>
                    <div className={styles.infoPanelTitle}>Founder-facing meaning</div>
                    <div className={styles.infoPanelText}>{getEventSummary(latestEvent)}</div>
                  </div>

                  {latestReceipt && allocationRule ? (
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
                                <span className={`${styles.intentDot} ${dotClassMap[bucket.kind]}`} />
                                <div className={styles.allocName}>{bucket.label}</div>
                              </div>
                              <span className={styles.allocPct} style={{ color: colorMap[bucket.kind] }}>
                                {percent}% | {formatMoney(bucket.amountCents, "USDC")}
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
                  ) : null}
                </>
              ) : (
                <div className={styles.emptyState}>
                  No Dodo event yet. Complete a checkout or replay a supported webhook.
                </div>
              )}
            </div>
            <div className={styles.footer}>
              <span className={styles.footerLabel}>lifecycle signals</span>
              <span className={styles.footerValue}>
                {snapshot.metrics.lifecycleSignalCount} founder review only
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
                  const percent = ruleBucket ? Math.round(ruleBucket.percentageBps / 100) : 0;
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
                          {ruleBucket?.label ?? intent.bucketKind.replaceAll("_", " ")}
                        </div>
                        <div className={styles.intentWallet}>{shortId(intent.recipientWallet, 10, 4)}</div>
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
              <span className={styles.footerValue}>USDC | Solana devnet</span>
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
              <span className={`${styles.tag} ${snapshot.webhookReady ? styles.tagGreen : styles.tagRed}`}>
                {snapshot.webhookReady ? "live" : "missing secret"}
              </span>
            </div>
            <div className={styles.cardBodyFlush}>
              {snapshot.events.length > 0 ? (
                snapshot.events.slice(0, 4).map((event, index) => (
                  <div className={styles.whItem} key={event.id}>
                    <span
                      className={styles.whTypePill}
                      style={{
                        background:
                          getEventRouteKind(event) === "recurring_route"
                            ? "var(--purple-pale)"
                            : getEventRouteKind(event) === "budget_signal"
                              ? "var(--blue-pale)"
                              : getEventRouteKind(event) === "lifecycle_signal"
                                ? "var(--amber-pale)"
                                : "var(--green-pale)",
                        color:
                          getEventRouteKind(event) === "recurring_route"
                            ? "var(--purple)"
                            : getEventRouteKind(event) === "budget_signal"
                              ? "var(--blue)"
                              : getEventRouteKind(event) === "lifecycle_signal"
                                ? "var(--amber)"
                                : "var(--green)",
                      }}
                    >
                      {event.type}
                    </span>
                    <div className={styles.whDetails}>
                      <div className={styles.whId}>{shortId(event.id, 10, 4)}</div>
                      <div className={styles.whRule}>{getEventRouteKindLabel(getEventRouteKind(event))}</div>
                    </div>
                    <span className={styles.whTime}>{index === 0 ? "latest" : `${index} old`}</span>
                  </div>
                ))
              ) : (
                <div className={styles.emptyState}>No webhooks received yet.</div>
              )}
            </div>
          </div>

          <TreasuryCopilotCard />

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <div className={styles.cardEyebrow}>active rule</div>
                <div className={styles.cardTitle}>{allocationRule?.name ?? "No live rule yet"}</div>
              </div>
              <span className={`${styles.tag} ${allocationRule ? styles.tagGreen : styles.tagMuted}`}>
                {allocationRule ? "enabled" : "waiting"}
              </span>
            </div>
            <div className={styles.cardBody}>
              {allocationRule ? (
                <>
                  <div className={styles.miniLabel} style={{ marginBottom: 8 }}>
                    {allocationRule.id}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
                    <DataPair label="Workspace" value={allocationRule.workspaceId} />
                    <DataPair label="Merchant" value={allocationRule.merchantId} />
                    <DataPair label="Product tag" value={allocationRule.productTag ?? "n/a"} />
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
                {allocationRule ? `${allocationRule.buckets.length} configured` : "waiting for data"}
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
                    style={{ fontSize: 11, marginBottom: 10, color: "var(--ink-muted)" }}
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
                    <DataPair label="Intents" value={`${latestReceipt.payoutIntents.length} generated`} />
                    <DataPair
                      label="Solana settlement"
                      value={
                        <span
                          className={`${styles.tag} ${
                            getReceiptSettlementLabel(
                              latestReceipt.payoutIntents.map((intent) => intent.status)
                            ) === "quarantined"
                              ? styles.tagRed
                              : getReceiptSettlementLabel(
                                    latestReceipt.payoutIntents.map((intent) => intent.status)
                                  ) === "confirmed"
                                ? styles.tagBlue
                                : getReceiptSettlementLabel(
                                      latestReceipt.payoutIntents.map((intent) => intent.status)
                                    ) === "approval blocked"
                                  ? styles.tagRed
                                  : styles.tagAmber
                          }`}
                        >
                          {getReceiptSettlementLabel(
                            latestReceipt.payoutIntents.map((intent) => intent.status)
                          )}
                        </span>
                      }
                    />
                    <DataPair
                      label="Explorer"
                      value={
                        latestReceipt.payoutIntents.find((intent) => intent.explorerUrl) ? (
                          <a
                            href={latestReceipt.payoutIntents.find((intent) => intent.explorerUrl)?.explorerUrl}
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

function LinkButton({ href, children }: { href: string; children: React.ReactNode }) {
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
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, gap: 10 }}>
      <span className={styles.muted}>{label}</span>
      <span className={styles.mono} style={emphasize ? { color: "var(--green)" } : undefined}>
        {value}
      </span>
    </div>
  );
}

function DemoStep({
  step,
  title,
  body,
  toneClass,
}: {
  step: string;
  title: string;
  body: string;
  toneClass: string;
}) {
  return (
    <div className={styles.demoStoryStep}>
      <div className={`${styles.demoStepBadge} ${toneClass}`}>{step}</div>
      <div className={styles.demoStepTitle}>{title}</div>
      <div className={styles.demoStepBody}>{body}</div>
    </div>
  );
}

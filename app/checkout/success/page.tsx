import Link from "next/link";
import styles from "./page.module.css";

const nextSteps = [
  {
    label: "Dodo confirms settlement",
    body: "The hosted checkout hands control back here while the signed webhook reaches AllocRail.",
  },
  {
    label: "AllocRail matches the treasury rule",
    body: "Routing metadata is matched against the founder rule to create the correct payout route.",
  },
  {
    label: "Founder reviews the queue",
    body: "Sensitive buckets stay approval-aware before any Solana USDC settlement is executed.",
  },
];

export default function CheckoutSuccessPage() {
  return (
    <main className={styles.page}>
      <div className={styles.noise} aria-hidden="true" />
      <div className={styles.shell}>
        <div className={styles.hero}>
          <div className={styles.eyebrow}>Checkout Complete</div>
          <div className={styles.brandRow}>
            <Link href="/" className={styles.brand}>
              AllocRail
            </Link>
            <span className={styles.brandPill}>Dodo {"->"} Solana treasury flow</span>
          </div>

          <h1 className={styles.title}>
            Revenue is in motion.
            <span>The treasury route is next.</span>
          </h1>

          <p className={styles.copy}>
            Dodo has completed the hosted checkout. AllocRail now waits for the
            verified webhook, matches the routing metadata, and prepares the
            payout route for founder review and Solana USDC settlement.
          </p>

          <div className={styles.actions}>
            <Link href="/dashboard" className={styles.primaryButton}>
              Open Founder Dashboard
            </Link>
            <Link href="/dashboard/payout-intents" className={styles.secondaryButton}>
              Review Settlement Queue
            </Link>
          </div>
        </div>

        <section className={styles.grid}>
          <div className={styles.card}>
            <div className={styles.cardEyebrow}>What happens now</div>
            <div className={styles.timeline}>
              {nextSteps.map((step, index) => (
                <div key={step.label} className={styles.timelineRow}>
                  <div className={styles.timelineMarker}>{index + 1}</div>
                  <div>
                    <div className={styles.timelineTitle}>{step.label}</div>
                    <div className={styles.timelineCopy}>{step.body}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardEyebrow}>Founder-facing result</div>
            <div className={styles.metricBlock}>
              <div className={styles.metricLabel}>AllocRail interprets this as</div>
              <div className={styles.metricValue}>one actionable payout route</div>
              <div className={styles.metricCopy}>
                Subscription and budget side signals stay visible in the dashboard,
                but the founder queue stays focused on the real money route.
              </div>
            </div>

            <div className={styles.statusPanel}>
              <div className={styles.statusHeader}>
                <span className={styles.statusDot} />
                Webhook expected
              </div>
              <div className={styles.statusCopy}>
                If the event has already landed, the new route will appear in
                Revenue Events, Payout Intents, and Receipts.
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

import Link from "next/link";
import {
  findRevenueEventByReference,
  listRecentReceipts,
} from "@/app/lib/allocrail/event-store";
import {
  formatMoney,
  formatTimestamp,
  getReceiptSettlementLabel,
  shortId,
} from "@/app/lib/allocrail/dashboard-data";
import type { AllocRailReceipt, RevenueEvent } from "@/app/lib/allocrail/types";
import styles from "./page.module.css";

function firstValue(
  params: Record<string, string | string[] | undefined>,
  ...keys: string[]
) {
  for (const key of keys) {
    const value = params[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
    if (Array.isArray(value) && typeof value[0] === "string" && value[0].trim()) {
      return value[0].trim();
    }
  }
  return undefined;
}

function bucketSummary(receipt?: AllocRailReceipt | null) {
  if (!receipt) {
    return "Contractor payout, tax reserve, founder share, and AI agent budget.";
  }

  return receipt.allocationRule.buckets.map((bucket) => bucket.label).join(" | ");
}

function receiptMatch(
  receipts: AllocRailReceipt[],
  references: {
    paymentId?: string;
    checkoutSessionId?: string;
    subscriptionId?: string;
  }
) {
  return receipts.find((receipt) => {
    const event = receipt.revenueEvent;
    return (
      (references.paymentId && event.dodoPaymentId === references.paymentId) ||
      (references.checkoutSessionId &&
        event.checkoutSessionId === references.checkoutSessionId) ||
      (references.subscriptionId &&
        event.dodoSubscriptionId === references.subscriptionId)
    );
  });
}

function settlementBadge(receipt?: AllocRailReceipt | null) {
  if (!receipt) {
    return "Webhook live";
  }

  return getReceiptSettlementLabel(receipt.payoutIntents.map((intent) => intent.status));
}

function settlementCopy(receipt?: AllocRailReceipt | null) {
  if (!receipt) {
    return "AllocRail is verifying the Dodo event and preparing the treasury route.";
  }

  const label = getReceiptSettlementLabel(
    receipt.payoutIntents.map((intent) => intent.status)
  );

  if (label === "confirmed") {
    return "The treasury route is settled and the audit receipt is ready.";
  }

  if (label === "approval blocked") {
    return "The route exists, but one or more buckets are blocked on approval.";
  }

  if (label === "quarantined") {
    return "The route is quarantined because refund or dispute logic needs review.";
  }

  if (label === "submitting") {
    return "Solana execution has started and signatures are being confirmed.";
  }

  if (label === "partial failure") {
    return "Some payout intents failed and need founder review before retry.";
  }

  return "The route is ready and waiting for founder review or execution.";
}

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const paymentId = firstValue(params, "payment_id", "paymentId");
  const checkoutSessionId = firstValue(
    params,
    "checkout_session_id",
    "checkoutSessionId",
    "session_id",
    "sessionId"
  );
  const subscriptionId = firstValue(params, "subscription_id", "subscriptionId");

  const matchedEvent = await findRevenueEventByReference({
    paymentId,
    checkoutSessionId,
    subscriptionId,
  }).catch(() => undefined);
  const receipts = await listRecentReceipts().catch(() => []);
  const matchedReceipt =
    receiptMatch(receipts, { paymentId, checkoutSessionId, subscriptionId }) ??
    (matchedEvent
      ? receipts.find((receipt) => receipt.revenueEvent.id === matchedEvent.id)
      : undefined);

  const resolvedEvent: RevenueEvent | undefined =
    matchedReceipt?.revenueEvent ?? matchedEvent;
  const resolvedPaymentId = resolvedEvent?.dodoPaymentId ?? paymentId;
  const resolvedCheckoutSessionId =
    resolvedEvent?.checkoutSessionId ?? checkoutSessionId;
  const resolvedAmount = resolvedEvent
    ? formatMoney(resolvedEvent.amountCents, resolvedEvent.currency)
    : "Waiting for webhook";
  const resolvedTimestamp = resolvedEvent
    ? formatTimestamp(resolvedEvent.receivedAt)
    : "Return acknowledged";
  const resolvedStatus = settlementBadge(matchedReceipt);
  const resolvedCopy = settlementCopy(matchedReceipt);

  return (
    <main className={styles.page}>
      <div className={styles.noise} aria-hidden="true" />
      <div className={styles.ambient} aria-hidden="true" />

      <nav className={styles.nav}>
        <Link href="/" className={styles.navBrand}>
          AllocRail
        </Link>
        <div className={styles.navSep} />
        <span className={styles.navCrumb}>// checkout success</span>
      </nav>

      <div className={styles.shell}>
        <div className={styles.hero}>
          <div className={styles.statusBadge}>
            <span className={styles.pip} />
            <span className={styles.statusLabel}>Dodo checkout complete</span>
          </div>

          <h1 className={styles.title}>
            Revenue event
            <span>received.</span>
          </h1>

          <p className={styles.copy}>
            Dodo confirmed the payment. AllocRail is now verifying the webhook,
            matching your routing metadata, and preparing the treasury route for
            Solana USDC settlement.
          </p>
        </div>

        <section className={styles.grid}>
          <div className={styles.pipelineCard}>
            <div className={styles.cardHeader}>
              <span className={styles.cardTitle}>AllocRail treasury pipeline</span>
              <span className={styles.cardCount}>Receipt-aware flow</span>
            </div>

            <div className={styles.steps}>
              <div className={`${styles.step} ${styles.done}`}>
                <div className={styles.stepIcon}>01</div>
                <div className={styles.stepBody}>
                  <div className={styles.stepLabel}>Dodo checkout</div>
                  <div className={styles.stepMeta}>
                    Payment captured and customer returned to AllocRail.
                  </div>
                </div>
                <span className={`${styles.stepTag} ${styles.tagDone}`}>done</span>
              </div>

              <div
                className={`${styles.step} ${
                  resolvedEvent ? styles.done : styles.active
                }`}
              >
                <div className={styles.stepIcon}>02</div>
                <div className={styles.stepBody}>
                  <div className={styles.stepLabel}>
                    {!resolvedEvent ? <span className={styles.liveDot} /> : null}
                    Verified webhook
                  </div>
                  <div className={styles.stepMeta}>
                    Dodo signature, idempotency, and replay checks before routing.
                  </div>
                </div>
                <span
                  className={`${styles.stepTag} ${
                    resolvedEvent ? styles.tagDone : styles.tagLive
                  }`}
                >
                  {resolvedEvent ? "verified" : "live"}
                </span>
              </div>

              <div
                className={`${styles.step} ${
                  matchedReceipt ? styles.done : styles.queue
                }`}
              >
                <div className={styles.stepIcon}>03</div>
                <div className={styles.stepBody}>
                  <div className={styles.stepLabel}>Allocation rule match</div>
                  <div className={styles.stepMeta}>{bucketSummary(matchedReceipt)}</div>
                </div>
                <span
                  className={`${styles.stepTag} ${
                    matchedReceipt ? styles.tagDone : styles.tagNext
                  }`}
                >
                  {matchedReceipt ? "matched" : "next"}
                </span>
              </div>

              <div className={`${styles.step} ${styles.queue}`}>
                <div className={styles.stepIcon}>04</div>
                <div className={styles.stepBody}>
                  <div className={styles.stepLabel}>Receipt + payout route</div>
                  <div className={styles.stepMeta}>
                    Customer receipt first, founder queue next, Solana settlement after
                    approval.
                  </div>
                </div>
                <span className={`${styles.stepTag} ${styles.tagNext}`}>
                  {matchedReceipt ? resolvedStatus : "pending"}
                </span>
              </div>
            </div>
          </div>

          <div className={styles.receiptCard}>
            <div className={styles.cardHeader}>
              <span className={styles.cardTitle}>Payment confirmation</span>
              <span className={styles.cardCount}>{resolvedStatus}</span>
            </div>

            <div className={styles.receiptHero}>
              <div>
                <div className={styles.receiptLabel}>Amount received</div>
                <div className={styles.receiptAmount}>{resolvedAmount}</div>
              </div>
              <div className={styles.receiptStamp}>{resolvedStatus}</div>
            </div>

            <div className={styles.metaGrid}>
              <div className={styles.metaRow}>
                <span className={styles.metaKey}>Received</span>
                <span className={styles.metaValue}>{resolvedTimestamp}</span>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.metaKey}>Payment ID</span>
                <span className={styles.metaValue}>{shortId(resolvedPaymentId)}</span>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.metaKey}>Checkout session</span>
                <span className={styles.metaValue}>
                  {shortId(resolvedCheckoutSessionId)}
                </span>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.metaKey}>Route summary</span>
                <span className={styles.metaValue}>{resolvedCopy}</span>
              </div>
            </div>

            <div className={styles.actionGroup}>
              {resolvedPaymentId ? (
                <a
                  href={`/api/allocrail/payments/${resolvedPaymentId}/receipt`}
                  className={styles.primaryButton}
                >
                  View Dodo payment receipt
                </a>
              ) : null}

              {matchedReceipt ? (
                <Link
                  href={`/dashboard/receipts/${matchedReceipt.id}`}
                  className={styles.secondaryButton}
                >
                  View AllocRail audit receipt
                </Link>
              ) : (
                <Link href="/dashboard/receipts" className={styles.secondaryButton}>
                  Open treasury receipts
                </Link>
              )}
            </div>
          </div>
        </section>

        <div className={styles.footerBar}>
          <Link href="/dashboard" className={styles.footerPrimary}>
            Open Treasury Dashboard
          </Link>
          <Link href="/dashboard/payout-intents" className={styles.footerSecondary}>
            Review settlement queue
          </Link>
        </div>

        <div className={styles.footerNote}>
          <span>Dodo test_mode</span>
          <span className={styles.footerSep}>.</span>
          <span>Solana devnet</span>
          <span className={styles.footerSep}>.</span>
          <span>AllocRail treasury pipeline</span>
        </div>
      </div>
    </main>
  );
}

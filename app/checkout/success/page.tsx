import Link from "next/link";
import { findRevenueEventByReference } from "@/app/lib/allocrail/event-store";
import { formatMoney, shortId } from "@/app/lib/allocrail/dashboard-data";
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

  const resolvedPaymentId = matchedEvent?.dodoPaymentId ?? paymentId;
  const resolvedAmount = matchedEvent
    ? formatMoney(matchedEvent.amountCents, matchedEvent.currency)
    : null;

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

      <section className={styles.centerWrap}>
        <div className={styles.statusBadge}>
          <span className={styles.pip} />
          <span className={styles.statusLabel}>Payment confirmed</span>
        </div>

        <h1 className={styles.title}>
          Checkout
          <span>succeeded.</span>
        </h1>

        <p className={styles.copy}>
          Your Dodo payment was completed successfully. You can download the
          Dodo receipt below, then open the founder dashboard to review the
          revenue route inside AllocRail.
        </p>

        <div className={styles.card}>
          <div className={styles.cardEyebrow}>Payment confirmation</div>

          {resolvedAmount ? (
            <div className={styles.amountBlock}>
              <div className={styles.amountLabel}>Amount paid</div>
              <div className={styles.amountValue}>{resolvedAmount}</div>
            </div>
          ) : null}

          {resolvedPaymentId ? (
            <div className={styles.metaLine}>
              Payment ID: <span>{shortId(resolvedPaymentId)}</span>
            </div>
          ) : null}

          <div className={styles.notice}>
            AllocRail will show the corresponding revenue route in the dashboard.
          </div>

          <div className={styles.actions}>
            {resolvedPaymentId ? (
              <a
                href={`/api/allocrail/payments/${resolvedPaymentId}/receipt`}
                className={styles.primaryButton}
              >
                Download Dodo receipt
              </a>
            ) : null}

            <Link href="/dashboard" className={styles.secondaryButton}>
              Open dashboard
            </Link>

            <Link href="/dashboard/events" className={styles.secondaryButton}>
              Open revenue routes
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

import Link from "next/link";
import { claimRevenueRouteByReference } from "@/app/lib/allocrail/claim";
import { formatMoney, shortId } from "@/app/lib/allocrail/dashboard-data";
import { findRevenueEventByReference } from "@/app/lib/allocrail/event-store";
import { getSupabaseServerClient } from "@/app/lib/supabase/server";
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

function buildClaimNextPath(args: {
  paymentId?: string;
  checkoutSessionId?: string;
  subscriptionId?: string;
}) {
  const params = new URLSearchParams();
  if (args.paymentId) params.set("payment_id", args.paymentId);
  if (args.checkoutSessionId) {
    params.set("checkout_session_id", args.checkoutSessionId);
  }
  if (args.subscriptionId) params.set("subscription_id", args.subscriptionId);
  params.set("claim", "1");
  return `/checkout/success?${params.toString()}`;
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
  const claimRequested = firstValue(params, "claim") === "1";

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const matchedEvent = await findRevenueEventByReference({
    paymentId,
    checkoutSessionId,
    subscriptionId,
  }).catch(() => undefined);

  const resolvedPaymentId = matchedEvent?.dodoPaymentId ?? paymentId;
  const resolvedAmount = matchedEvent
    ? formatMoney(matchedEvent.amountCents, matchedEvent.currency)
    : null;
  const claimedRoute =
    user && (paymentId || checkoutSessionId || subscriptionId)
      ? await claimRevenueRouteByReference({
          paymentId,
          checkoutSessionId,
          subscriptionId,
        }).catch(() => undefined)
      : undefined;
  const routeHref = resolvedPaymentId
    ? `/dashboard/payout-intents?payment=${encodeURIComponent(resolvedPaymentId)}`
    : "/dashboard/payout-intents";
  const claimNext = buildClaimNextPath({
    paymentId,
    checkoutSessionId,
    subscriptionId,
  });
  const showClaimPrompt = !user && Boolean(paymentId || checkoutSessionId || subscriptionId);

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
          {showClaimPrompt
            ? "Your Dodo payment was completed successfully. Create or sign into AllocRail to claim this treasury route and view it inside your founder dashboard."
            : "Your Dodo payment was completed successfully. You can download the Dodo receipt below, then open the founder dashboard to review the revenue route inside AllocRail."}
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
            {user
              ? claimRequested && claimedRoute?.revenueEvent
                ? "This revenue route is now linked to your founder workspace."
                : "AllocRail will show the corresponding revenue route in the dashboard."
              : "Sign in or create an account to attach this payment to your AllocRail founder workspace."}
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

            {showClaimPrompt ? (
              <>
                <Link
                  href={`/signup?next=${encodeURIComponent(claimNext)}`}
                  className={styles.primaryButton}
                >
                  Create account to claim route
                </Link>
                <Link
                  href={`/login?next=${encodeURIComponent(claimNext)}`}
                  className={styles.secondaryButton}
                >
                  Sign in to view route
                </Link>
              </>
            ) : (
              <>
                <Link href="/dashboard" className={styles.secondaryButton}>
                  Open dashboard
                </Link>

                <Link href={routeHref} className={styles.secondaryButton}>
                  Open revenue route
                </Link>
              </>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

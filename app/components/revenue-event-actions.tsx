"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import styles from "@/app/dashboard/dashboard.module.css";

export function RevenueEventActions({
  paymentId,
  receiptId,
  canRefund = true,
  refundId,
  disabledLabel = "Held",
}: {
  paymentId?: string;
  receiptId?: string;
  canRefund?: boolean;
  refundId?: string;
  disabledLabel?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const requestRefund = () => {
    if (!paymentId || !canRefund) {
      return;
    }

    setError(null);
    setSuccess(null);
    startTransition(async () => {
      try {
        const response = await fetch(
          `/api/allocrail/payments/${paymentId}/refund`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              reason: "Founder-requested refund from revenue inbox",
            }),
          }
        );

        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(payload.error || "Refund request failed");
        }

        setShowConfirm(false);
        setSuccess("Refund requested in Dodo. Route hold is now active.");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Refund request failed");
      }
    });
  };

  return (
    <div className={styles.revenueActions}>
      <div className={styles.revenueActionRow}>
        {receiptId ? (
          <Link
            href={`/dashboard/receipts/${receiptId}`}
            className={styles.inlineAction}
          >
            Open receipt
          </Link>
        ) : null}
        {paymentId ? (
          <a
            href={`/api/allocrail/payments/${paymentId}/receipt`}
            className={styles.inlineAction}
          >
            Dodo receipt
          </a>
        ) : null}
        {refundId ? (
          <a
            href={`/api/allocrail/refunds/${refundId}/receipt`}
            className={styles.inlineAction}
          >
            Refund receipt
          </a>
        ) : null}
        {paymentId && canRefund ? (
          <button
            type="button"
            className={styles.inlineActionPrimary}
            disabled={isPending}
            onClick={() => {
              setError(null);
              setSuccess(null);
              setShowConfirm((current) => !current);
            }}
          >
            Refund
          </button>
        ) : null}
        {paymentId && !canRefund ? (
          <span className={`${styles.tag} ${styles.tagMuted}`}>{disabledLabel}</span>
        ) : null}
      </div>

      {showConfirm && paymentId && canRefund ? (
        <div className={styles.inlineConfirmCard}>
          <div className={styles.inlineConfirmText}>
            Request refund in Dodo and hold all open Solana payout intents for this payment?
          </div>
          <div className={styles.inlineConfirmActions}>
            <button
              type="button"
              className={styles.inlineActionPrimary}
              disabled={isPending}
              onClick={requestRefund}
            >
              {isPending ? "Refunding..." : "Confirm refund"}
            </button>
            <button
              type="button"
              className={styles.inlineAction}
              disabled={isPending}
              onClick={() => setShowConfirm(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {success ? <div className={styles.inlineSuccess}>{success}</div> : null}
      {error ? <div className={styles.inlineError}>{error}</div> : null}
    </div>
  );
}

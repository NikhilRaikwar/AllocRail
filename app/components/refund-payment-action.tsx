"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import styles from "@/app/dashboard/dashboard.module.css";

export function RefundPaymentAction({
  paymentId,
  disabled,
}: {
  paymentId: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    setError(null);
    setMessage(null);

    startTransition(async () => {
      try {
        const response = await fetch(
          `/api/allocrail/payments/${paymentId}/refund`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ reason }),
          }
        );

        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(payload.error || "Refund request failed");
        }

        const refundId =
          typeof payload?.refund?.refund_id === "string"
            ? payload.refund.refund_id
            : "pending";

        setMessage(`Refund requested in Dodo (${refundId}). Route held.`);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Refund request failed");
      }
    });
  };

  return (
    <div className={styles.stack} style={{ gap: 10 }}>
      <div className={styles.formField}>
        <label className={styles.formLabel} htmlFor={`refund-reason-${paymentId}`}>
          refund reason
        </label>
        <input
          id={`refund-reason-${paymentId}`}
          className={styles.formInput}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Customer requested cancellation"
          maxLength={3000}
          disabled={isPending || disabled}
        />
      </div>
      <button
        type="button"
        className={styles.inlineActionPrimary}
        onClick={submit}
        disabled={isPending || disabled}
      >
        {isPending ? "Requesting refund..." : "Refund customer"}
      </button>
      <div className={styles.helperText}>
        Refund runs through Dodo on the original payment rail. AllocRail
        immediately holds open Solana payout intents for this payment.
      </div>
      {message ? (
        <div className={styles.inlineSuccess}>{message}</div>
      ) : null}
      {error ? <div className={styles.inlineError}>{error}</div> : null}
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import styles from "@/app/dashboard/dashboard.module.css";
import type { PayoutIntent } from "@/app/lib/allocrail/types";

async function post(path: string) {
  const response = await fetch(path, { method: "POST" });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || "Request failed");
  }

  return payload;
}

export function PayoutIntentActions({ intent }: { intent: PayoutIntent }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const showApprove = intent.status === "pending_approval";
  const showExecute =
    intent.status === "approved" ||
    (!intent.requiresApproval && intent.status === "draft") ||
    intent.status === "failed";

  const run = (path: string) => {
    setError(null);
    startTransition(async () => {
      try {
        await post(path);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Request failed");
      }
    });
  };

  return (
    <div className={styles.intentActions}>
      {showApprove ? (
        <button
          type="button"
          className={styles.inlineAction}
          disabled={isPending}
          onClick={() => run(`/api/allocrail/payout-intents/${intent.id}/approve`)}
        >
          {isPending ? "Approving..." : "Approve"}
        </button>
      ) : null}
      {showExecute ? (
        <button
          type="button"
          className={styles.inlineActionPrimary}
          disabled={isPending}
          onClick={() => run(`/api/allocrail/payout-intents/${intent.id}/execute`)}
        >
          {isPending ? "Executing..." : intent.status === "failed" ? "Retry" : "Execute"}
        </button>
      ) : null}
      {error ? <div className={styles.inlineError}>{error}</div> : null}
    </div>
  );
}

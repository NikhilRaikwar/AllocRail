"use client";

import { useState } from "react";
import type { DodoRoutingMetadata } from "../lib/allocrail/types";

type CheckoutButtonProps = {
  metadata: DodoRoutingMetadata;
  email: string;
  name: string;
};

type CheckoutResponse = {
  sessionId?: string;
  checkoutUrl?: string | null;
  error?: string;
};

export function CheckoutButton({
  metadata,
  email,
  name,
}: CheckoutButtonProps) {
  const [status, setStatus] = useState<
    "idle" | "loading" | "redirecting" | "error"
  >("idle");
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  async function startCheckout() {
    setStatus("loading");
    setError(null);
    setSessionId(null);

    try {
      const response = await fetch("/api/dodo/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name,
          quantity: 1,
          metadata,
        }),
      });

      const data = (await response.json()) as CheckoutResponse;

      if (!response.ok || !data.checkoutUrl) {
        throw new Error(data.error || "Dodo checkout did not return a URL.");
      }

      setSessionId(data.sessionId ?? null);
      setStatus("redirecting");
      await new Promise((resolve) => setTimeout(resolve, 900));
      window.location.href = data.checkoutUrl;
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Checkout failed.");
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={startCheckout}
        disabled={status === "loading" || status === "redirecting"}
        className="w-fit rounded-lg bg-foreground px-4 py-2 text-sm font-semibold text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "loading"
          ? "Creating checkout..."
          : status === "redirecting"
            ? "Redirecting to Dodo..."
            : "Start Dodo checkout"}
      </button>
      {sessionId ? (
        <p className="max-w-xl font-mono text-xs leading-6 text-foreground/55">
          Session created: {sessionId}
        </p>
      ) : null}
      {status === "redirecting" ? (
        <p className="max-w-xl text-sm leading-6 text-foreground/60">
          Dodo checkout is ready. Redirecting now.
        </p>
      ) : null}
      {status === "error" && error ? (
        <p className="max-w-xl text-sm leading-6 text-destructive">{error}</p>
      ) : null}
    </div>
  );
}

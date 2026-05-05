"use client";

import { useState } from "react";
import type { DodoRoutingMetadata } from "../lib/allocrail/types";

type CheckoutButtonProps = {
  metadata: DodoRoutingMetadata;
  email: string;
  name: string;
  label?: string;
  className?: string;
  buttonClassName?: string;
  sessionClassName?: string;
  statusClassName?: string;
  errorClassName?: string;
  onSessionCreated?: (sessionId: string) => void;
  onRedirect?: (checkoutUrl: string) => void;
  onError?: (message: string) => void;
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
  label = "Start Dodo checkout",
  className,
  buttonClassName,
  sessionClassName,
  statusClassName,
  errorClassName,
  onSessionCreated,
  onRedirect,
  onError,
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
      if (data.sessionId) {
        onSessionCreated?.(data.sessionId);
      }
      setStatus("redirecting");
      onRedirect?.(data.checkoutUrl);
      await new Promise((resolve) => setTimeout(resolve, 900));
      window.location.href = data.checkoutUrl;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Checkout failed.";
      setStatus("error");
      setError(message);
      onError?.(message);
    }
  }

  return (
    <div className={className ?? "flex flex-col gap-3"}>
      <button
        type="button"
        onClick={startCheckout}
        disabled={status === "loading" || status === "redirecting"}
        className={
          buttonClassName ??
          "inline-flex h-12 w-fit items-center justify-center rounded-full bg-[linear-gradient(135deg,#8b5cf6,#6d5dfc)] px-6 text-sm font-semibold text-white shadow-[0_18px_50px_rgba(109,93,252,0.32)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        }
      >
        {status === "loading"
          ? "Creating checkout..."
          : status === "redirecting"
            ? "Redirecting to Dodo..."
            : label}
      </button>
      {sessionId ? (
        <p
          className={
            sessionClassName ??
            "max-w-xl font-mono text-xs leading-6 text-foreground/55"
          }
        >
          Session created: {sessionId}
        </p>
      ) : null}
      {status === "redirecting" ? (
        <p
          className={
            statusClassName ?? "max-w-xl text-sm leading-6 text-foreground/60"
          }
        >
          Dodo checkout is ready. Redirecting now.
        </p>
      ) : null}
      {status === "error" && error ? (
        <p
          className={
            errorClassName ?? "max-w-xl text-sm leading-6 text-destructive"
          }
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}

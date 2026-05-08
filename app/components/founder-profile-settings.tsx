"use client";

import { useState, useTransition } from "react";
import styles from "@/app/dashboard/dashboard.module.css";
import { useWallet } from "@/app/lib/wallet/context";
import type {
  FounderProfile,
  TreasuryFxSource,
  TreasuryRefillMode,
} from "@/app/lib/allocrail/types";

function encodeBase64(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes));
}

export function FounderProfileSettings({
  initialFounder,
}: {
  initialFounder: FounderProfile;
}) {
  const [fullName, setFullName] = useState(initialFounder.fullName);
  const [savedFounder, setSavedFounder] = useState(initialFounder);
  const [treasuryRefillMode, setTreasuryRefillMode] =
    useState<TreasuryRefillMode>(initialFounder.treasuryRefillMode);
  const [fxSource, setFxSource] = useState<TreasuryFxSource>(
    initialFounder.fxSource
  );
  const [fxRateInrUsd, setFxRateInrUsd] = useState(
    String(initialFounder.fxRateInrUsd)
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [walletSuccess, setWalletSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isWalletPending, startWalletTransition] = useTransition();
  const { wallet } = useWallet();
  const connectedWallet = wallet?.account.address;
  const walletCanSign = Boolean(wallet?.signMessage);

  const saveProfile = () => {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      try {
        const response = await fetch("/api/allocrail/founder-profile", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fullName,
            treasuryRefillMode,
            fxSource,
            fxRateInrUsd: Number(fxRateInrUsd),
          }),
        });

        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(payload.error || "Failed to save founder profile");
        }

        setSavedFounder(payload.founder as FounderProfile);
        setFullName((payload.founder as FounderProfile).fullName);
        setTreasuryRefillMode(
          (payload.founder as FounderProfile).treasuryRefillMode
        );
        setFxSource((payload.founder as FounderProfile).fxSource);
        setFxRateInrUsd(String((payload.founder as FounderProfile).fxRateInrUsd));
        setSuccess("Founder profile and treasury config updated.");
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to save founder profile"
        );
      }
    });
  };

  const bindConnectedWallet = () => {
    setWalletError(null);
    setWalletSuccess(null);
    startWalletTransition(async () => {
      try {
        if (!connectedWallet || !wallet?.signMessage) {
          throw new Error("Connect a wallet with message-sign support first.");
        }

        const challengeResponse = await fetch(
          "/api/allocrail/wallet-binding/challenge",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ walletAddress: connectedWallet }),
          }
        );
        const challengePayload = await challengeResponse.json().catch(() => ({}));
        if (!challengeResponse.ok) {
          throw new Error(
            challengePayload.error || "Failed to create wallet binding challenge"
          );
        }

        const message = new TextEncoder().encode(
          challengePayload.challenge.message as string
        );
        const signed = await wallet.signMessage(message);

        const verifyResponse = await fetch("/api/allocrail/wallet-binding/verify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            walletAddress: connectedWallet,
            signedMessage: encodeBase64(signed.signedMessage),
            signature: encodeBase64(signed.signature),
          }),
        });
        const verifyPayload = await verifyResponse.json().catch(() => ({}));
        if (!verifyResponse.ok) {
          throw new Error(
            verifyPayload.error || "Failed to verify wallet binding"
          );
        }

        setSavedFounder(verifyPayload.founder as FounderProfile);
        setWalletSuccess("Treasury operator wallet bound.");
      } catch (err) {
        setWalletError(
          err instanceof Error ? err.message : "Failed to bind treasury wallet"
        );
      }
    });
  };

  const unbindWallet = () => {
    setWalletError(null);
    setWalletSuccess(null);
    startWalletTransition(async () => {
      try {
        const response = await fetch("/api/allocrail/wallet-binding", {
          method: "DELETE",
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(payload.error || "Failed to remove wallet binding");
        }
        setSavedFounder(payload.founder as FounderProfile);
        setWalletSuccess("Treasury operator wallet removed.");
      } catch (err) {
        setWalletError(
          err instanceof Error ? err.message : "Failed to remove wallet binding"
        );
      }
    });
  };

  return (
    <div className={styles.ruleEditorCard}>
      <div className={styles.formGrid}>
        <div className={styles.formField}>
          <label className={styles.formLabel} htmlFor="founder-full-name">
            Full name
          </label>
          <input
            id="founder-full-name"
            className={styles.formInput}
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            placeholder="Founder name"
          />
        </div>
        <div className={styles.formField}>
          <label className={styles.formLabel}>Email</label>
          <input
            className={styles.formInput}
            value={savedFounder.email}
            readOnly
            aria-readonly="true"
          />
        </div>
        <div className={styles.formField}>
          <label className={styles.formLabel}>Treasury operator wallet</label>
          <input
            className={styles.formInput}
            value={savedFounder.treasuryOperatorWallet ?? "Not bound"}
            readOnly
            aria-readonly="true"
          />
        </div>
        <div className={styles.formField}>
          <label className={styles.formLabel}>Connected wallet</label>
          <input
            className={styles.formInput}
            value={connectedWallet ?? "No wallet connected"}
            readOnly
            aria-readonly="true"
          />
        </div>
        <div className={styles.formField}>
          <label className={styles.formLabel} htmlFor="treasury-refill-mode">
            Treasury refill mode
          </label>
          <select
            id="treasury-refill-mode"
            className={styles.formSelect}
            value={treasuryRefillMode}
            onChange={(event) =>
              setTreasuryRefillMode(event.target.value as TreasuryRefillMode)
            }
          >
            <option value="prefunded_treasury">Pre-funded treasury</option>
            <option value="manual_rebalance">Manual rebalance</option>
            <option value="external_fx_partner">External FX partner</option>
          </select>
        </div>
        <div className={styles.formField}>
          <label className={styles.formLabel} htmlFor="fx-source">
            FX source
          </label>
          <select
            id="fx-source"
            className={styles.formSelect}
            value={fxSource}
            onChange={(event) => setFxSource(event.target.value as TreasuryFxSource)}
          >
            <option value="manual_rate">Manual treasury rate</option>
            <option value="treasury_desk">Treasury desk reference</option>
            <option value="exchange_reference">Exchange reference</option>
          </select>
        </div>
        <div className={styles.formField}>
          <label className={styles.formLabel} htmlFor="fx-rate-inr-usd">
            INR to USD basis
          </label>
          <input
            id="fx-rate-inr-usd"
            className={styles.formInput}
            value={fxRateInrUsd}
            onChange={(event) => setFxRateInrUsd(event.target.value)}
            placeholder="83"
            inputMode="decimal"
          />
        </div>
        <div className={styles.formField}>
          <label className={styles.formLabel}>Wallet bound at</label>
          <input
            className={styles.formInput}
            value={savedFounder.walletBoundAt ?? "Not verified yet"}
            readOnly
            aria-readonly="true"
          />
        </div>
      </div>

      <div className={styles.ruleEditorActions}>
        <div className={styles.helperText}>
          Founder actions now require the bound treasury operator wallet. Payout
          execution is raised from that wallet directly, while refill mode and
          FX basis remain explicit founder-managed settings.
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            className={styles.smallButton}
            onClick={saveProfile}
            disabled={isPending}
          >
            {isPending ? "Saving..." : "Save profile"}
          </button>
          <button
            type="button"
            className={styles.smallButton}
            onClick={bindConnectedWallet}
            disabled={isWalletPending || !connectedWallet || !walletCanSign}
          >
            {isWalletPending ? "Binding..." : "Bind connected wallet"}
          </button>
          <button
            type="button"
            className={styles.smallButton}
            onClick={unbindWallet}
            disabled={isWalletPending || !savedFounder.treasuryOperatorWallet}
          >
            Unbind wallet
          </button>
        </div>
      </div>

      {error ? <div className={styles.ruleAudit} style={{ color: "var(--red)" }}>{error}</div> : null}
      {success ? (
        <div className={styles.ruleAudit} style={{ color: "var(--green)" }}>
          {success}
        </div>
      ) : null}
      {walletError ? (
        <div className={styles.ruleAudit} style={{ color: "var(--red)" }}>
          {walletError}
        </div>
      ) : null}
      {walletSuccess ? (
        <div className={styles.ruleAudit} style={{ color: "var(--green)" }}>
          {walletSuccess}
        </div>
      ) : null}
    </div>
  );
}

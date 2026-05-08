"use client";

import bs58 from "bs58";
import {
  Connection,
  PublicKey,
  Transaction,
} from "@solana/web3.js";
import {
  createAssociatedTokenAccountInstruction,
  createTransferCheckedInstruction,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import styles from "@/app/dashboard/dashboard.module.css";
import type { PayoutIntent } from "@/app/lib/allocrail/types";
import { useWallet } from "@/app/lib/wallet/context";
import { useCluster } from "@/app/components/cluster-context";

async function post(path: string, walletAddress?: string, body?: unknown) {
  const response = await fetch(path, {
    method: "POST",
    headers: walletAddress
      ? {
          "Content-Type": "application/json",
          "x-allocrail-wallet-address": walletAddress,
        }
      : {
          "Content-Type": "application/json",
        },
    body: body == null ? undefined : JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || "Request failed");
  }

  return payload;
}

export function PayoutIntentActions({ intent }: { intent: PayoutIntent }) {
  const router = useRouter();
  const { wallet } = useWallet();
  const { cluster } = useCluster();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const showApprove = intent.status === "pending_approval";
  const showReject =
    intent.status === "pending_approval" || intent.status === "approved";
  const showExecute =
    intent.status === "approved" ||
    (!intent.requiresApproval && intent.status === "draft") ||
    intent.status === "failed";

  const run = (path: string) => {
    setError(null);
    startTransition(async () => {
      try {
        await post(path, wallet?.account.address);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Request failed");
      }
    });
  };

  const executeWithWallet = () => {
    setError(null);
    startTransition(async () => {
      try {
        if (!wallet?.sendTransaction) {
          throw new Error("Connected wallet cannot send transactions.");
        }

        const prepare = await post(
          `/api/allocrail/payout-intents/${intent.id}/execute`,
          wallet.account.address,
          { action: "prepare" }
        );
        const plan = prepare.executionPlan as {
          authorityWallet: string;
          recipientWallet: string;
          amountBaseUnits: string;
          mintAddress: string;
          decimals: number;
          rpcUrl: string;
        };

        const connection = new Connection(plan.rpcUrl, "confirmed");
        const authority = new PublicKey(plan.authorityWallet);
        const recipient = new PublicKey(plan.recipientWallet);
        const mint = new PublicKey(plan.mintAddress);
        const senderAta = getAssociatedTokenAddressSync(mint, authority);
        const recipientAta = getAssociatedTokenAddressSync(mint, recipient);
        const recipientAtaInfo = await connection.getAccountInfo(recipientAta);
        const latestBlockhash = await connection.getLatestBlockhash("confirmed");

        const transaction = new Transaction({
          feePayer: authority,
          blockhash: latestBlockhash.blockhash,
          lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
        });

        if (!recipientAtaInfo) {
          transaction.add(
            createAssociatedTokenAccountInstruction(
              authority,
              recipientAta,
              recipient,
              mint
            )
          );
        }

        transaction.add(
          createTransferCheckedInstruction(
            senderAta,
            mint,
            recipientAta,
            authority,
            BigInt(plan.amountBaseUnits),
            plan.decimals
          )
        );

        const wireBytes = transaction.serialize({
          requireAllSignatures: false,
          verifySignatures: false,
        });
        const signatureBytes = await wallet.sendTransaction(
          wireBytes,
          `solana:${cluster}`
        );
        const signature = bs58.encode(signatureBytes);

        await connection.confirmTransaction(
          {
            signature,
            blockhash: latestBlockhash.blockhash,
            lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
          },
          "confirmed"
        );

        await post(
          `/api/allocrail/payout-intents/${intent.id}/execute`,
          wallet.account.address,
          {
            action: "confirm",
            signature,
            submittedAt: new Date().toISOString(),
          }
        );

        router.refresh();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Wallet execution failed"
        );
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
      {showReject ? (
        <button
          type="button"
          className={styles.inlineAction}
          disabled={isPending}
          onClick={() => run(`/api/allocrail/payout-intents/${intent.id}/reject`)}
        >
          {isPending ? "Rejecting..." : "Reject"}
        </button>
      ) : null}
      {showExecute ? (
        <button
          type="button"
          className={styles.inlineActionPrimary}
          disabled={isPending}
          onClick={executeWithWallet}
        >
          {isPending ? "Executing..." : intent.status === "failed" ? "Retry" : "Execute"}
        </button>
      ) : null}
      {error ? <div className={styles.inlineError}>{error}</div> : null}
    </div>
  );
}

import { Connection, PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { NextResponse } from "next/server";
import {
  getPayoutIntentById,
  updatePayoutIntent,
} from "@/app/lib/allocrail/event-store";
import { getAppEnvironment } from "@/app/lib/allocrail/env";
import {
  listCurrentFounderOwnedWorkspaceIds,
  requireBoundFounderWallet,
} from "@/app/lib/allocrail/founder";

export const runtime = "nodejs";

function canExecute(status: string, requiresApproval: boolean) {
  if (status === "submitted" || status === "confirmed") return false;
  if (requiresApproval) {
    return status === "approved" || status === "failed";
  }
  return status === "draft" || status === "approved" || status === "failed";
}

function centsToTokenUnits(cents: number, decimals: number) {
  const scale = decimals - 2;
  if (scale < 0) {
    throw new Error(`Unsupported mint decimals ${decimals} for cent-based routing`);
  }
  return BigInt(cents) * 10n ** BigInt(scale);
}

function readTokenAmount(info: Record<string, unknown>) {
  const tokenAmount = info.tokenAmount;
  if (
    tokenAmount &&
    typeof tokenAmount === "object" &&
    "amount" in tokenAmount &&
    typeof tokenAmount.amount === "string"
  ) {
    return tokenAmount.amount;
  }

  if (typeof info.amount === "string") {
    return info.amount;
  }

  return undefined;
}

async function verifyWalletExecutedTransfer(args: {
  signature: string;
  authorityWallet: string;
  recipientWallet: string;
  amountCents: number;
}) {
  const env = getAppEnvironment();
  const connection = new Connection(env.solanaRpcUrl, "confirmed");
  const tx = await connection.getParsedTransaction(args.signature, {
    maxSupportedTransactionVersion: 0,
    commitment: "confirmed",
  });

  if (!tx) {
    throw new Error("Wallet transaction was not found on the configured Solana cluster.");
  }

  if (tx.meta?.err) {
    throw new Error("Wallet transaction failed on-chain and cannot settle this payout intent.");
  }

  const mint = new PublicKey(env.solanaUsdcMint);
  const authority = new PublicKey(args.authorityWallet);
  const recipient = new PublicKey(args.recipientWallet);
  const expectedSourceAta = getAssociatedTokenAddressSync(mint, authority).toBase58();
  const expectedDestinationAta = getAssociatedTokenAddressSync(
    mint,
    recipient
  ).toBase58();
  const expectedAmount = centsToTokenUnits(args.amountCents, 6).toString();

  const matchingInstruction = tx.transaction.message.instructions.find((instruction) => {
    if (!("parsed" in instruction) || !instruction.parsed) {
      return false;
    }

    const parsed = instruction.parsed as {
      type?: string;
      info?: Record<string, unknown>;
    };
    if (
      parsed.type !== "transferChecked" &&
      parsed.type !== "transfer"
    ) {
      return false;
    }

    const info = parsed.info ?? {};
    const source = typeof info.source === "string" ? info.source : undefined;
    const destination =
      typeof info.destination === "string" ? info.destination : undefined;
    const authorityAddress =
      typeof info.authority === "string" ? info.authority : undefined;
    const amount = readTokenAmount(info);
    const mintAddress = typeof info.mint === "string" ? info.mint : env.solanaUsdcMint;

    return (
      source === expectedSourceAta &&
      destination === expectedDestinationAta &&
      authorityAddress === args.authorityWallet &&
      amount === expectedAmount &&
      mintAddress === env.solanaUsdcMint
    );
  });

  if (!matchingInstruction) {
    throw new Error(
      "Connected wallet transaction did not match the expected USDC payout transfer."
    );
  }

  return {
    cluster: env.solanaCluster,
    explorerUrl:
      env.solanaCluster === "mainnet"
        ? `https://explorer.solana.com/tx/${args.signature}`
        : `https://explorer.solana.com/tx/${args.signature}?cluster=${env.solanaCluster}`,
  };
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const founder = await requireBoundFounderWallet(req);
    const workspaceIds = await listCurrentFounderOwnedWorkspaceIds();
    const { id } = await params;
    const intent = await getPayoutIntentById(id, { workspaceIds });
    const body = (await req.json().catch(() => ({}))) as {
      action?: "prepare" | "confirm";
      signature?: string;
      submittedAt?: string;
    };

    if (!intent) {
      return NextResponse.json({ error: "Payout intent not found" }, { status: 404 });
    }

    if (!canExecute(intent.status, intent.requiresApproval)) {
      return NextResponse.json(
        { error: `Payout intent ${id} is not executable from status ${intent.status}` },
        { status: 409 }
      );
    }

    if ((body.action ?? "prepare") === "prepare") {
      const env = getAppEnvironment();
      return NextResponse.json({
        ok: true,
        executionPlan: {
          payoutIntentId: intent.id,
          authorityWallet: founder.treasuryOperatorWallet,
          recipientWallet: intent.recipientWallet,
          amountCents: intent.amountCents,
          amountBaseUnits: centsToTokenUnits(intent.amountCents, 6).toString(),
          currency: intent.currency,
          mintAddress: env.solanaUsdcMint,
          decimals: 6,
          cluster: env.solanaCluster,
          rpcUrl: env.solanaRpcUrl,
        },
      });
    }

    if (!body.signature) {
      return NextResponse.json(
        { error: "Wallet execution signature is required." },
        { status: 400 }
      );
    }

    const settlement = await verifyWalletExecutedTransfer({
      signature: body.signature,
      authorityWallet: founder.treasuryOperatorWallet!,
      recipientWallet: intent.recipientWallet,
      amountCents: intent.amountCents,
    });

    const updated = await updatePayoutIntent(id, (current) => ({
      ...current,
      status: "confirmed",
      solanaCluster: settlement.cluster,
      solanaSignature: body.signature,
      explorerUrl: settlement.explorerUrl,
      submittedAt: body.submittedAt ?? new Date().toISOString(),
      confirmedAt: new Date().toISOString(),
      failureReason: undefined,
      failedAt: undefined,
    }), { workspaceIds });

    return NextResponse.json({ ok: true, payoutIntent: updated });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to confirm wallet-executed payout";
    const { id } = await params;

    try {
      const workspaceIds = await listCurrentFounderOwnedWorkspaceIds();
      const failed = await updatePayoutIntent(id, (current) => ({
        ...current,
        status: "failed",
        failedAt: new Date().toISOString(),
        failureReason: message,
      }), { workspaceIds });

      return NextResponse.json({ error: message, payoutIntent: failed }, { status: 500 });
    } catch {
      const status =
        message === "Unauthorized"
          ? 401
          : message.includes("does not match") ||
              message.includes("Connect the bound treasury operator wallet") ||
              message.includes("Bind a treasury operator wallet")
            ? 400
            : 500;

      return NextResponse.json({ error: message }, { status });
    }
  }
}

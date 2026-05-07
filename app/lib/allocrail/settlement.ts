import bs58 from "bs58";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import {
  getAccount,
  getMint,
  getOrCreateAssociatedTokenAccount,
  transferChecked,
} from "@solana/spl-token";
import { getAppEnvironment } from "./env";
import type { PayoutIntent } from "./types";

function parseSecretKey(secret: string) {
  const trimmed = secret.trim();

  if (!trimmed) {
    throw new Error("TREASURY_SIGNER_SECRET_KEY is not configured");
  }

  if (trimmed.startsWith("[")) {
    return Uint8Array.from(JSON.parse(trimmed) as number[]);
  }

  if (trimmed.includes(",")) {
    const values = trimmed.split(",").map((value) => Number(value.trim()));
    if (values.some((value) => Number.isNaN(value))) {
      throw new Error("TREASURY_SIGNER_SECRET_KEY contains invalid numeric values");
    }
    return Uint8Array.from(values);
  }

  return bs58.decode(trimmed);
}

function centsToTokenUnits(cents: number, decimals: number) {
  const scale = decimals - 2;
  if (scale < 0) {
    throw new Error(`Unsupported mint decimals ${decimals} for cent-based routing`);
  }
  return BigInt(cents) * 10n ** BigInt(scale);
}

function getExplorerUrl(signature: string, cluster: string) {
  return `https://explorer.solana.com/tx/${signature}?cluster=${cluster}`;
}

function getTreasuryKeypair() {
  const secret = process.env.TREASURY_SIGNER_SECRET_KEY || "";
  return Keypair.fromSecretKey(parseSecretKey(secret));
}

export async function executeUsdcPayout(intent: PayoutIntent) {
  const env = getAppEnvironment();
  const treasurySigner = getTreasuryKeypair();
  const connection = new Connection(env.solanaRpcUrl, "confirmed");
  const mint = new PublicKey(env.solanaUsdcMint);
  const recipientWallet = new PublicKey(intent.recipientWallet);

  const mintAccount = await getMint(connection, mint);
  const amount = centsToTokenUnits(intent.amountCents, mintAccount.decimals);

  const treasuryTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    treasurySigner,
    mint,
    treasurySigner.publicKey
  );

  const treasuryBalance = await getAccount(connection, treasuryTokenAccount.address);

  if (treasuryBalance.amount < amount) {
    throw new Error(
      `Treasury USDC balance is too low for ${intent.id}. Need ${amount.toString()} base units.`
    );
  }

  const recipientTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    treasurySigner,
    mint,
    recipientWallet
  );

  const submittedAt = new Date().toISOString();
  const signature = await transferChecked(
    connection,
    treasurySigner,
    treasuryTokenAccount.address,
    mint,
    recipientTokenAccount.address,
    treasurySigner.publicKey,
    amount,
    mintAccount.decimals
  );

  await connection.confirmTransaction(signature, "confirmed");

  return {
    signature,
    cluster: env.solanaCluster,
    submittedAt,
    confirmedAt: new Date().toISOString(),
    explorerUrl: getExplorerUrl(signature, env.solanaCluster),
  };
}

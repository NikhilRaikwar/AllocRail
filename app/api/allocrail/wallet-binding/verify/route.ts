import { NextRequest, NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { ed25519 } from "@noble/curves/ed25519";
import {
  bindTreasuryOperatorWallet,
  buildWalletBindingMessage,
  verifyWalletBinding,
} from "@/app/lib/allocrail/founder";

export const runtime = "nodejs";

function decodeBase64(value: string) {
  return Uint8Array.from(Buffer.from(value, "base64"));
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      walletAddress?: string;
      signature?: string;
      signedMessage?: string;
    };

    const verified = await verifyWalletBinding({
      walletAddress: body.walletAddress ?? "",
      signature: body.signature ?? "",
      signedMessage: body.signedMessage ?? "",
    });

    if (!body.signature || !body.signedMessage) {
      throw new Error("Wallet signature payload is incomplete.");
    }

    const expectedMessage = new TextEncoder().encode(
      buildWalletBindingMessage({
        userId: verified.founder.userId,
        walletAddress: verified.walletAddress,
        nonce: verified.nonce,
      })
    );
    const signedMessage = decodeBase64(body.signedMessage);
    const signature = decodeBase64(body.signature);

    if (
      signedMessage.length !== expectedMessage.length ||
      !signedMessage.every((byte, index) => byte === expectedMessage[index])
    ) {
      throw new Error("Signed wallet message did not match the latest founder challenge.");
    }

    const publicKey = new PublicKey(verified.walletAddress).toBytes();
    const ok = ed25519.verify(signature, signedMessage, publicKey);
    if (!ok) {
      throw new Error("Wallet signature verification failed.");
    }

    const founder = await bindTreasuryOperatorWallet({
      walletAddress: verified.walletAddress,
    });

    return NextResponse.json({ founder });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to verify wallet binding";
    const status = message === "Unauthorized" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

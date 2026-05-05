import { NextRequest, NextResponse } from "next/server";
import {
  createDodoCheckoutSession,
  getDefaultRoutingMetadata,
} from "@/app/lib/allocrail/dodo";
import { getAppEnvironment } from "@/app/lib/allocrail/env";
import { parseDodoRoutingMetadata } from "@/app/lib/allocrail/metadata";

export const runtime = "nodejs";

type CheckoutRequestBody = {
  email?: unknown;
  name?: unknown;
  productId?: unknown;
  quantity?: unknown;
  metadata?: unknown;
};

function toStringOrUndefined(value: unknown) {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}

function toQuantity(value: unknown) {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1) {
    return 1;
  }
  return value;
}

function toMetadata(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return getDefaultRoutingMetadata();
  }
  return parseDodoRoutingMetadata(value as Record<string, unknown>);
}

export function GET() {
  const env = getAppEnvironment();
  const defaultMetadata = getDefaultRoutingMetadata();

  return NextResponse.json({
    route: "/api/dodo/checkout",
    method: "POST",
    ready: env.hasDodoApiKey && Boolean(process.env.DODO_TEST_PRODUCT_ID),
    dodoEnvironment: env.dodoEnvironment,
    hasDodoApiKey: env.hasDodoApiKey,
    hasDodoTestProductId: Boolean(process.env.DODO_TEST_PRODUCT_ID),
    defaultMetadata,
    exampleBody: {
      email: "founder-demo@allocrail.dev",
      name: "AllocRail Demo Customer",
      quantity: 1,
      metadata: defaultMetadata,
    },
  });
}

export async function POST(req: NextRequest) {
  let body: CheckoutRequestBody;

  try {
    body = (await req.json()) as CheckoutRequestBody;
  } catch {
    body = {};
  }

  const email = toStringOrUndefined(body.email);
  if (!email) {
    return NextResponse.json(
      { error: "A customer email is required to create Dodo checkout." },
      { status: 400 }
    );
  }

  try {
    const session = await createDodoCheckoutSession({
      email,
      name: toStringOrUndefined(body.name),
      productId: toStringOrUndefined(body.productId),
      quantity: toQuantity(body.quantity),
      metadata: toMetadata(body.metadata),
    });

    return NextResponse.json({
      sessionId: session.sessionId,
      checkoutUrl: session.checkoutUrl,
      productId: session.productId,
      metadata: session.metadata,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create checkout";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

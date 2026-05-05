import DodoPayments from "dodopayments";
import type { CheckoutSessionCreateParams } from "dodopayments/resources/checkout-sessions";
import { demoAllocationRule } from "./demo-data";
import { getAppEnvironment } from "./env";
import type { DodoRoutingMetadata } from "./types";

export type CreateDodoCheckoutInput = {
  email: string;
  name?: string;
  productId?: string;
  quantity?: number;
  metadata?: Partial<DodoRoutingMetadata>;
};

export type DodoCheckoutResult = {
  sessionId: string;
  checkoutUrl: string | null;
  metadata: DodoRoutingMetadata;
  productId: string;
};

function getDodoApiKey() {
  const apiKey = process.env.DODO_PAYMENTS_API_KEY;
  if (!apiKey) {
    throw new Error("DODO_PAYMENTS_API_KEY is not configured");
  }
  return apiKey;
}

function getDodoTestProductId() {
  const productId = process.env.DODO_TEST_PRODUCT_ID;
  if (!productId) {
    throw new Error("DODO_TEST_PRODUCT_ID is not configured");
  }
  return productId;
}

export function getDefaultRoutingMetadata(
  metadata?: Partial<DodoRoutingMetadata>
): DodoRoutingMetadata {
  return {
    workspace_id: metadata?.workspace_id || demoAllocationRule.workspaceId,
    merchant_id: metadata?.merchant_id || demoAllocationRule.merchantId,
    rule_id: metadata?.rule_id || demoAllocationRule.id,
    product_tag: metadata?.product_tag || demoAllocationRule.productTag,
  };
}

export function getDodoClient() {
  const env = getAppEnvironment();

  return new DodoPayments({
    bearerToken: getDodoApiKey(),
    environment: env.dodoEnvironment,
  });
}

export async function createDodoCheckoutSession(
  input: CreateDodoCheckoutInput
): Promise<DodoCheckoutResult> {
  const env = getAppEnvironment();
  const productId = input.productId || getDodoTestProductId();
  const metadata = getDefaultRoutingMetadata(input.metadata);
  const quantity = input.quantity && input.quantity > 0 ? input.quantity : 1;

  const params: CheckoutSessionCreateParams = {
    product_cart: [{ product_id: productId, quantity }],
    customer: {
      email: input.email,
      name: input.name,
    },
    billing_address: {
      country: "IN",
    },
    billing_currency: "INR",
    metadata,
    return_url: `${env.appUrl}/checkout/success`,
    cancel_url: env.appUrl,
    minimal_address: true,
    feature_flags: {
      redirect_immediately: true,
    },
  };

  const session = await getDodoClient().checkoutSessions.create(params);

  return {
    sessionId: session.session_id,
    checkoutUrl: session.checkout_url ?? null,
    metadata,
    productId,
  };
}

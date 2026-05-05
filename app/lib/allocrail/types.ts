export type AllocationBucketKind =
  | "contractor_escrow"
  | "tax_reserve"
  | "founder_share"
  | "agent_budget";

export type RevenueEventType =
  | "payment.succeeded"
  | "subscription.active"
  | "subscription.renewed"
  | "credit.added"
  | "credit.deducted";

export type PayoutIntentStatus =
  | "draft"
  | "pending_approval"
  | "approved"
  | "paid"
  | "failed";

export type AllocationBucket = {
  kind: AllocationBucketKind;
  label: string;
  percentageBps: number;
  recipientWallet: string;
  requiresApproval: boolean;
};

export type AllocationRule = {
  id: string;
  workspaceId: string;
  merchantId: string;
  name: string;
  productTag: string;
  currency: "USDC";
  buckets: AllocationBucket[];
  dailyLimitUsdCents: number;
  enabled: boolean;
};

export type DodoRoutingMetadata = {
  workspace_id: string;
  merchant_id: string;
  rule_id: string;
  product_tag: string;
};

export type RevenueEvent = {
  id: string;
  dodoEventId: string;
  dodoPaymentId: string;
  type: RevenueEventType;
  amountUsdCents: number;
  currency: "USD";
  metadata: DodoRoutingMetadata;
  receivedAt: string;
};

export type PayoutIntent = {
  id: string;
  revenueEventId: string;
  bucketKind: AllocationBucketKind;
  recipientWallet: string;
  amountUsdcCents: number;
  status: PayoutIntentStatus;
  solanaSignature?: string;
};

export type AllocRailReceipt = {
  id: string;
  revenueEvent: RevenueEvent;
  allocationRule: AllocationRule;
  payoutIntents: PayoutIntent[];
};

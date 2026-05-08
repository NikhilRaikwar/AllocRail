export type AllocationBucketKind =
  | "contractor_escrow"
  | "tax_reserve"
  | "founder_share"
  | "agent_budget";

export type RevenueEventType =
  | "payment.succeeded"
  | "refund.succeeded"
  | "refund.failed"
  | "dispute.opened"
  | "dispute.expired"
  | "dispute.accepted"
  | "dispute.cancelled"
  | "dispute.challenged"
  | "dispute.won"
  | "dispute.lost"
  | "subscription.active"
  | "subscription.renewed"
  | "credit.added"
  | "credit.deducted";

export type PayoutIntentStatus =
  | "draft"
  | "pending_approval"
  | "approved"
  | "rejected"
  | "quarantined"
  | "submitted"
  | "confirmed"
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
  dailyLimitCents: number;
  enabled: boolean;
  createdByUserId?: string;
  updatedByUserId?: string;
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
  dodoPaymentId?: string;
  dodoSubscriptionId?: string;
  checkoutSessionId?: string;
  dodoRefundId?: string;
  dodoRefundStatus?: string;
  refundReason?: string;
  refundRequestedAt?: string;
  refundedAt?: string;
  type: RevenueEventType;
  amountCents: number;
  currency: string;
  metadata: DodoRoutingMetadata;
  receivedAt: string;
};

export type PayoutIntent = {
  id: string;
  revenueEventId: string;
  bucketKind: AllocationBucketKind;
  recipientWallet: string;
  amountCents: number;
  currency: "USDC";
  requiresApproval: boolean;
  status: PayoutIntentStatus;
  approvedByUserId?: string;
  approvedByName?: string;
  approvedAt?: string;
  rejectedByUserId?: string;
  rejectedByName?: string;
  rejectedAt?: string;
  solanaCluster?: string;
  solanaSignature?: string;
  explorerUrl?: string;
  submittedAt?: string;
  confirmedAt?: string;
  failedAt?: string;
  failureReason?: string;
};

export type AllocRailReceipt = {
  id: string;
  revenueEvent: RevenueEvent;
  allocationRule: AllocationRule;
  payoutIntents: PayoutIntent[];
};

export type FounderProfile = {
  userId: string;
  email: string;
  fullName: string;
};

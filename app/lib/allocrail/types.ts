export type AllocationBucketKind =
  | "contractor_escrow"
  | "tax_reserve"
  | "founder_share"
  | "agent_budget";

export type TreasuryRefillMode =
  | "prefunded_treasury"
  | "manual_rebalance"
  | "external_fx_partner";

export type TreasuryFxSource =
  | "manual_rate"
  | "treasury_desk"
  | "exchange_reference";

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
  | "subscription.cancelled"
  | "subscription.updated"
  | "credit.added"
  | "credit.deducted"
  | "credit.balance_low";

export type RevenueRouteKind =
  | "revenue_route"
  | "recurring_route"
  | "budget_signal"
  | "lifecycle_signal";

export type RevenueEventContext = {
  routeKind: RevenueRouteKind;
  summary?: string;
  subscriptionStatus?: string;
  subscriptionProductId?: string;
  nextBillingDate?: string;
  customerId?: string;
  creditEntitlementId?: string;
  creditEntitlementName?: string;
  availableBalance?: string;
  thresholdAmount?: string;
  thresholdPercent?: number;
  ledgerAmount?: string;
  sourceReferenceId?: string;
  sourceReferenceType?: string;
};

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
  dodoCustomerId?: string;
  checkoutSessionId?: string;
  dodoRefundId?: string;
  dodoRefundStatus?: string;
  refundReason?: string;
  refundRequestedAt?: string;
  refundedAt?: string;
  creditEntitlementId?: string;
  creditEntitlementName?: string;
  sourceReferenceId?: string;
  sourceReferenceType?: string;
  eventContext?: RevenueEventContext;
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
  treasuryOperatorWallet?: string;
  walletBoundAt?: string;
  treasuryRefillMode: TreasuryRefillMode;
  fxSource: TreasuryFxSource;
  fxRateInrUsd: number;
  fxRateUpdatedAt?: string;
};

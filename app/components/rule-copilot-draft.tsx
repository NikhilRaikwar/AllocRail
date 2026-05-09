"use client";

import { useState, useTransition } from "react";
import styles from "@/app/dashboard/dashboard.module.css";
import type {
  AllocationBucket,
  AllocationBucketKind,
} from "@/app/lib/allocrail/types";

type RuleCopilotDraft = {
  name: string;
  productTag: string;
  workspaceId: string;
  merchantId: string;
  dailyLimitUsd: number;
  enabled: boolean;
  rationale: string;
  buckets: Array<{
    kind: AllocationBucketKind;
    label: string;
    percentageBps: number;
    requiresApproval: boolean;
  }>;
};

export function RuleCopilotDraft({
  defaultWallets,
  onApply,
}: {
  defaultWallets: Partial<Record<AllocationBucketKind, string>>;
  onApply: (draft: {
    name: string;
    workspaceId: string;
    merchantId: string;
    productTag: string;
    dailyLimitUsd: string;
    enabled: boolean;
    buckets: AllocationBucket[];
  }) => void;
}) {
  const [prompt, setPrompt] = useState("");
  const [rationale, setRationale] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastDraftName, setLastDraftName] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const draftRule = () => {
    setError(null);
    setRationale(null);
    startTransition(async () => {
      try {
        const response = await fetch("/api/allocrail/copilot/rule-draft", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ prompt }),
        });

        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(payload.error || "Failed to draft rule");
        }

        const draft = payload.draft as RuleCopilotDraft;
        setRationale(draft.rationale);
        setLastDraftName(draft.name);
        onApply({
          name: draft.name,
          workspaceId: draft.workspaceId,
          merchantId: draft.merchantId,
          productTag: draft.productTag,
          dailyLimitUsd: String(draft.dailyLimitUsd),
          enabled: draft.enabled,
          buckets: draft.buckets.map((bucket) => ({
            kind: bucket.kind,
            label: bucket.label,
            percentageBps: bucket.percentageBps,
            recipientWallet: defaultWallets[bucket.kind] ?? "",
            requiresApproval: bucket.requiresApproval,
          })),
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to draft rule");
      }
    });
  };

  return (
    <div className={styles.card} style={{ marginBottom: 18 }}>
      <div className={styles.cardHeader}>
        <div>
          <div className={styles.cardEyebrow}>milestone 8</div>
          <div className={styles.cardTitle}>Treasury Rule Copilot</div>
        </div>
        <span className={`${styles.tag} ${styles.tagBlue}`}>gpt-4o-mini</span>
      </div>
      <div className={styles.cardBody}>
        <div className={styles.helperText} style={{ marginBottom: 10 }}>
          Draft a rule in natural language. The copilot uses your existing wallet map where possible and leaves unknown destinations blank.
        </div>
        <textarea
          className={styles.formInput}
          style={{ minHeight: 96, paddingTop: 10, paddingBottom: 10 }}
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="Split enterprise subscription revenue 45 contractor, 15 tax reserve, 30 founder, 10 agent budget. Require approval for contractor and agent budget."
        />
        <div className={styles.ruleEditorActions} style={{ marginTop: 12 }}>
          <div className={styles.helperText}>
            Founders get a draft rule only. Nothing is saved until you review and click Create rule.
          </div>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={draftRule}
            disabled={isPending || prompt.trim().length < 10}
          >
            {isPending ? "Drafting..." : "Draft with AI"}
          </button>
        </div>
        {rationale ? (
          <div className={styles.infoPanel} style={{ marginTop: 12 }}>
            <div className={styles.infoPanelTitle}>Copilot rationale</div>
            <div className={styles.infoPanelText}>{rationale}</div>
            {lastDraftName ? (
              <div className={styles.ruleAudit}>Draft applied to editor: {lastDraftName}</div>
            ) : null}
          </div>
        ) : null}
        {error ? (
          <div className={styles.inlineError} style={{ marginTop: 10 }}>
            {error}
          </div>
        ) : !rationale ? (
          <div className={styles.helperText} style={{ marginTop: 10 }}>
            Best prompts mention a revenue source, exact split, and which buckets need approval.
          </div>
        ) : null}
      </div>
    </div>
  );
}

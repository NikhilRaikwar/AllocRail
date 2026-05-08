"use client";

import { useMemo, useState } from "react";
import styles from "@/app/dashboard/dashboard.module.css";
import type {
  AllocationBucket,
  AllocationBucketKind,
  AllocationRule,
} from "@/app/lib/allocrail/types";

type RuleDraft = {
  id?: string;
  name: string;
  workspaceId: string;
  merchantId: string;
  productTag: string;
  dailyLimitUsd: string;
  enabled: boolean;
  buckets: AllocationBucket[];
};

const bucketKinds: { value: AllocationBucketKind; label: string }[] = [
  { value: "contractor_escrow", label: "Contractor escrow" },
  { value: "tax_reserve", label: "Tax reserve" },
  { value: "founder_share", label: "Founder share" },
  { value: "agent_budget", label: "AI-agent budget" },
];

function emptyDraft(): RuleDraft {
  return {
    name: "",
    workspaceId: "wrk_allocrail_demo",
    merchantId: "mch_india_ai_saas",
    productTag: "",
    dailyLimitUsd: "25000",
    enabled: true,
    buckets: [
      {
        kind: "contractor_escrow",
        label: "Contractor escrow",
        percentageBps: 4500,
        recipientWallet: "",
        requiresApproval: true,
      },
      {
        kind: "tax_reserve",
        label: "Tax reserve",
        percentageBps: 1500,
        recipientWallet: "",
        requiresApproval: false,
      },
      {
        kind: "founder_share",
        label: "Founder share",
        percentageBps: 3000,
        recipientWallet: "",
        requiresApproval: false,
      },
      {
        kind: "agent_budget",
        label: "AI-agent budget",
        percentageBps: 1000,
        recipientWallet: "",
        requiresApproval: true,
      },
    ],
  };
}

function toDraft(rule: AllocationRule): RuleDraft {
  return {
    id: rule.id,
    name: rule.name,
    workspaceId: rule.workspaceId,
    merchantId: rule.merchantId,
    productTag: rule.productTag,
    dailyLimitUsd: (rule.dailyLimitCents / 100).toFixed(2).replace(/\.00$/, ""),
    enabled: rule.enabled,
    buckets: rule.buckets.map((bucket) => ({ ...bucket })),
  };
}

async function submitRule(draft: RuleDraft) {
  const payload = {
    name: draft.name,
    workspaceId: draft.workspaceId,
    merchantId: draft.merchantId,
    productTag: draft.productTag,
    dailyLimitUsd: Number(draft.dailyLimitUsd),
    enabled: draft.enabled,
    buckets: draft.buckets.map((bucket) => ({
      ...bucket,
      percentageBps: Number(bucket.percentageBps),
    })),
  };

  const response = await fetch(
    draft.id ? `/api/allocrail/rules/${draft.id}` : "/api/allocrail/rules",
    {
      method: draft.id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "Failed to save rule");
  }
  return data.rule as AllocationRule;
}

export function RulesManager({ initialRules }: { initialRules: AllocationRule[] }) {
  const [rules, setRules] = useState(initialRules);
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [draft, setDraft] = useState<RuleDraft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const totalBps = useMemo(
    () => draft?.buckets.reduce((sum, bucket) => sum + Number(bucket.percentageBps || 0), 0) ?? 0,
    [draft]
  );

  const startCreate = () => {
    setEditingId("new");
    setDraft(emptyDraft());
    setError(null);
  };

  const startEdit = (rule: AllocationRule) => {
    setEditingId(rule.id);
    setDraft(toDraft(rule));
    setError(null);
  };

  const cancel = () => {
    setEditingId(null);
    setDraft(null);
    setError(null);
  };

  const updateBucket = (index: number, updater: (bucket: AllocationBucket) => AllocationBucket) => {
    setDraft((current) =>
      current
        ? {
            ...current,
            buckets: current.buckets.map((bucket, bucketIndex) =>
              bucketIndex === index ? updater(bucket) : bucket
            ),
          }
        : current
    );
  };

  const removeBucket = (index: number) => {
    setDraft((current) =>
      current
        ? {
            ...current,
            buckets: current.buckets.filter((_, bucketIndex) => bucketIndex !== index),
          }
        : current
    );
  };

  const addBucket = () => {
    setDraft((current) =>
      current
        ? {
            ...current,
            buckets: [
              ...current.buckets,
              {
                kind: "contractor_escrow",
                label: "New bucket",
                percentageBps: 0,
                recipientWallet: "",
                requiresApproval: false,
              },
            ],
          }
        : current
    );
  };

  const save = async () => {
    if (!draft) return;
    setSaving(true);
    setError(null);
    try {
      const rule = await submitRule(draft);
      setRules((current) => {
        const others = current.filter((item) => item.id !== rule.id);
        return [rule, ...others];
      });
      cancel();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save rule");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className={styles.pageActions}>
        <button className={styles.primaryButton} type="button" onClick={startCreate}>
          + New Rule
        </button>
      </div>

      <div className={styles.card}>
        {rules.length > 0 ? (
          rules.map((rule) => {
            const isEditing = editingId === rule.id;

            return (
              <div key={rule.id}>
                <div className={styles.cardHeader}>
                  <div>
                    <div className={styles.cardEyebrow}>{rule.id}</div>
                    <div className={styles.cardTitle}>{rule.name}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <span
                      className={`${styles.tag} ${
                        rule.enabled ? styles.tagGreen : styles.tagMuted
                      }`}
                    >
                      {rule.enabled ? "enabled" : "disabled"}
                    </span>
                    <button
                      className={styles.secondaryButton}
                      style={{ fontSize: 11, padding: "5px 12px" }}
                      type="button"
                      onClick={() => startEdit(rule)}
                    >
                      Edit
                    </button>
                  </div>
                </div>
                <div className={styles.cardBody}>
                  <div className={styles.miniGrid}>
                    <div>
                      <div className={styles.miniLabel}>Workspace</div>
                      <div className={styles.mono} style={{ fontSize: 11 }}>
                        {rule.workspaceId}
                      </div>
                    </div>
                    <div>
                      <div className={styles.miniLabel}>Merchant</div>
                      <div className={styles.mono} style={{ fontSize: 11 }}>
                        {rule.merchantId}
                      </div>
                    </div>
                    <div>
                      <div className={styles.miniLabel}>Product Tag</div>
                      <div className={styles.mono} style={{ fontSize: 11 }}>
                        {rule.productTag}
                      </div>
                    </div>
                  </div>

                  <div className={styles.miniLabel} style={{ marginBottom: 12 }}>
                    Allocation Buckets
                  </div>
                  <div className={styles.tableWrap}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Bucket</th>
                          <th>Recipient Wallet</th>
                          <th>Basis Points</th>
                          <th>%</th>
                          <th>Approval Required</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rule.buckets.map((bucket) => (
                          <tr key={`${rule.id}-${bucket.kind}`}>
                            <td>{bucket.label}</td>
                            <td className={`${styles.mono} ${styles.faint}`} style={{ fontSize: 10 }}>
                              {bucket.recipientWallet}
                            </td>
                            <td className={styles.mono} style={{ color: "var(--green)" }}>
                              {bucket.percentageBps}
                            </td>
                            <td className={`${styles.mono} ${styles.muted}`}>
                              {Math.round(bucket.percentageBps / 100)}%
                            </td>
                            <td>
                              <span
                                className={`${styles.tag} ${
                                  bucket.requiresApproval ? styles.tagRed : styles.tagMuted
                                }`}
                              >
                                {bucket.requiresApproval ? "Yes" : "No"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {(rule.createdByUserId || rule.updatedByUserId) && (
                    <div className={styles.ruleAudit}>
                      owner {rule.createdByUserId ?? "unknown"} · last editor{" "}
                      {rule.updatedByUserId ?? "unknown"}
                    </div>
                  )}
                </div>

                {isEditing && draft ? (
                  <div className={styles.ruleEditorCard}>
                    <div className={styles.formGrid}>
                      <div className={styles.formField}>
                        <label className={styles.formLabel}>Rule name</label>
                        <input
                          className={styles.formInput}
                          value={draft.name}
                          onChange={(event) =>
                            setDraft((current) =>
                              current ? { ...current, name: event.target.value } : current
                            )
                          }
                        />
                      </div>
                      <div className={styles.formField}>
                        <label className={styles.formLabel}>Product tag</label>
                        <input
                          className={styles.formInput}
                          value={draft.productTag}
                          onChange={(event) =>
                            setDraft((current) =>
                              current ? { ...current, productTag: event.target.value } : current
                            )
                          }
                        />
                      </div>
                      <div className={styles.formField}>
                        <label className={styles.formLabel}>Workspace ID</label>
                        <input
                          className={styles.formInput}
                          value={draft.workspaceId}
                          onChange={(event) =>
                            setDraft((current) =>
                              current ? { ...current, workspaceId: event.target.value } : current
                            )
                          }
                        />
                      </div>
                      <div className={styles.formField}>
                        <label className={styles.formLabel}>Merchant ID</label>
                        <input
                          className={styles.formInput}
                          value={draft.merchantId}
                          onChange={(event) =>
                            setDraft((current) =>
                              current ? { ...current, merchantId: event.target.value } : current
                            )
                          }
                        />
                      </div>
                      <div className={styles.formField}>
                        <label className={styles.formLabel}>Daily limit (USD)</label>
                        <input
                          className={styles.formInput}
                          type="number"
                          min="0"
                          step="0.01"
                          value={draft.dailyLimitUsd}
                          onChange={(event) =>
                            setDraft((current) =>
                              current ? { ...current, dailyLimitUsd: event.target.value } : current
                            )
                          }
                        />
                      </div>
                      <div className={styles.formField}>
                        <label className={styles.formLabel}>Rule status</label>
                        <label className={styles.checkboxRow}>
                          <input
                            type="checkbox"
                            checked={draft.enabled}
                            onChange={(event) =>
                              setDraft((current) =>
                                current ? { ...current, enabled: event.target.checked } : current
                              )
                            }
                          />
                          Enabled
                        </label>
                      </div>
                    </div>

                    <div className={styles.formLabel} style={{ marginBottom: 10 }}>
                      Allocation buckets
                    </div>
                    <div className={styles.bucketList}>
                      {draft.buckets.map((bucket, index) => (
                        <div className={styles.bucketCard} key={`${bucket.kind}-${index}`}>
                          <div className={styles.bucketHeader}>
                            <div className={styles.bucketTitle}>{bucket.label || "Bucket"}</div>
                            <div className={styles.bucketActions}>
                              <button
                                className={styles.smallButton}
                                type="button"
                                onClick={() => removeBucket(index)}
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                          <div className={styles.formGrid}>
                            <div className={styles.formField}>
                              <label className={styles.formLabel}>Bucket kind</label>
                              <select
                                className={styles.formSelect}
                                value={bucket.kind}
                                onChange={(event) =>
                                  updateBucket(index, (current) => ({
                                    ...current,
                                    kind: event.target.value as AllocationBucketKind,
                                  }))
                                }
                              >
                                {bucketKinds.map((kind) => (
                                  <option key={kind.value} value={kind.value}>
                                    {kind.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className={styles.formField}>
                              <label className={styles.formLabel}>Label</label>
                              <input
                                className={styles.formInput}
                                value={bucket.label}
                                onChange={(event) =>
                                  updateBucket(index, (current) => ({
                                    ...current,
                                    label: event.target.value,
                                  }))
                                }
                              />
                            </div>
                            <div className={styles.formField}>
                              <label className={styles.formLabel}>Basis points</label>
                              <input
                                className={styles.formInput}
                                type="number"
                                min="0"
                                max="10000"
                                value={bucket.percentageBps}
                                onChange={(event) =>
                                  updateBucket(index, (current) => ({
                                    ...current,
                                    percentageBps: Number(event.target.value),
                                  }))
                                }
                              />
                            </div>
                            <div className={styles.formField}>
                              <label className={styles.formLabel}>Approval required</label>
                              <label className={styles.checkboxRow}>
                                <input
                                  type="checkbox"
                                  checked={bucket.requiresApproval}
                                  onChange={(event) =>
                                    updateBucket(index, (current) => ({
                                      ...current,
                                      requiresApproval: event.target.checked,
                                    }))
                                  }
                                />
                                Require founder approval
                              </label>
                            </div>
                            <div className={`${styles.formField} ${styles.formFieldFull}`}>
                              <label className={styles.formLabel}>Recipient wallet</label>
                              <input
                                className={styles.formInput}
                                value={bucket.recipientWallet}
                                onChange={(event) =>
                                  updateBucket(index, (current) => ({
                                    ...current,
                                    recipientWallet: event.target.value,
                                  }))
                                }
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className={styles.ruleEditorActions}>
                      <div className={styles.helperText}>
                        Total basis points: {totalBps} / 10,000
                      </div>
                      <div style={{ display: "flex", gap: 10 }}>
                        <button className={styles.smallButton} type="button" onClick={addBucket}>
                          Add bucket
                        </button>
                        <button className={styles.secondaryButton} type="button" onClick={cancel}>
                          Cancel
                        </button>
                        <button
                          className={styles.primaryButton}
                          type="button"
                          disabled={saving}
                          onClick={save}
                        >
                          {saving ? "Saving..." : "Save rule"}
                        </button>
                      </div>
                    </div>
                    {error ? <div className={styles.inlineError} style={{ marginTop: 10 }}>{error}</div> : null}
                  </div>
                ) : null}

                <div className={styles.footer}>
                  <span className={styles.footerLabel}>total bps</span>
                  <span className={styles.footerValue}>
                    {rule.buckets.reduce((sum, bucket) => sum + bucket.percentageBps, 0)} / 10,000 OK
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className={styles.emptyState}>
            No live rules yet. Create your first founder-defined treasury rule.
          </div>
        )}

        {editingId === "new" && draft ? (
          <div className={styles.ruleEditorCard}>
            <div className={styles.cardTitle} style={{ marginBottom: 14 }}>
              New treasury rule
            </div>
            <div className={styles.formGrid}>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Rule name</label>
                <input
                  className={styles.formInput}
                  value={draft.name}
                  onChange={(event) =>
                    setDraft((current) =>
                      current ? { ...current, name: event.target.value } : current
                    )
                  }
                />
              </div>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Product tag</label>
                <input
                  className={styles.formInput}
                  value={draft.productTag}
                  onChange={(event) =>
                    setDraft((current) =>
                      current ? { ...current, productTag: event.target.value } : current
                    )
                  }
                />
              </div>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Workspace ID</label>
                <input
                  className={styles.formInput}
                  value={draft.workspaceId}
                  onChange={(event) =>
                    setDraft((current) =>
                      current ? { ...current, workspaceId: event.target.value } : current
                    )
                  }
                />
              </div>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Merchant ID</label>
                <input
                  className={styles.formInput}
                  value={draft.merchantId}
                  onChange={(event) =>
                    setDraft((current) =>
                      current ? { ...current, merchantId: event.target.value } : current
                    )
                  }
                />
              </div>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Daily limit (USD)</label>
                <input
                  className={styles.formInput}
                  type="number"
                  min="0"
                  step="0.01"
                  value={draft.dailyLimitUsd}
                  onChange={(event) =>
                    setDraft((current) =>
                      current ? { ...current, dailyLimitUsd: event.target.value } : current
                    )
                  }
                />
              </div>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Rule status</label>
                <label className={styles.checkboxRow}>
                  <input
                    type="checkbox"
                    checked={draft.enabled}
                    onChange={(event) =>
                      setDraft((current) =>
                        current ? { ...current, enabled: event.target.checked } : current
                      )
                    }
                  />
                  Enabled
                </label>
              </div>
            </div>

            <div className={styles.formLabel} style={{ marginBottom: 10 }}>
              Allocation buckets
            </div>
            <div className={styles.bucketList}>
              {draft.buckets.map((bucket, index) => (
                <div className={styles.bucketCard} key={`${bucket.kind}-${index}`}>
                  <div className={styles.bucketHeader}>
                    <div className={styles.bucketTitle}>{bucket.label || "Bucket"}</div>
                    <div className={styles.bucketActions}>
                      <button
                        className={styles.smallButton}
                        type="button"
                        onClick={() => removeBucket(index)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <div className={styles.formGrid}>
                    <div className={styles.formField}>
                      <label className={styles.formLabel}>Bucket kind</label>
                      <select
                        className={styles.formSelect}
                        value={bucket.kind}
                        onChange={(event) =>
                          updateBucket(index, (current) => ({
                            ...current,
                            kind: event.target.value as AllocationBucketKind,
                          }))
                        }
                      >
                        {bucketKinds.map((kind) => (
                          <option key={kind.value} value={kind.value}>
                            {kind.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className={styles.formField}>
                      <label className={styles.formLabel}>Label</label>
                      <input
                        className={styles.formInput}
                        value={bucket.label}
                        onChange={(event) =>
                          updateBucket(index, (current) => ({
                            ...current,
                            label: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className={styles.formField}>
                      <label className={styles.formLabel}>Basis points</label>
                      <input
                        className={styles.formInput}
                        type="number"
                        min="0"
                        max="10000"
                        value={bucket.percentageBps}
                        onChange={(event) =>
                          updateBucket(index, (current) => ({
                            ...current,
                            percentageBps: Number(event.target.value),
                          }))
                        }
                      />
                    </div>
                    <div className={styles.formField}>
                      <label className={styles.formLabel}>Approval required</label>
                      <label className={styles.checkboxRow}>
                        <input
                          type="checkbox"
                          checked={bucket.requiresApproval}
                          onChange={(event) =>
                            updateBucket(index, (current) => ({
                              ...current,
                              requiresApproval: event.target.checked,
                            }))
                          }
                        />
                        Require founder approval
                      </label>
                    </div>
                    <div className={`${styles.formField} ${styles.formFieldFull}`}>
                      <label className={styles.formLabel}>Recipient wallet</label>
                      <input
                        className={styles.formInput}
                        value={bucket.recipientWallet}
                        onChange={(event) =>
                          updateBucket(index, (current) => ({
                            ...current,
                            recipientWallet: event.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.ruleEditorActions}>
              <div className={styles.helperText}>
                Total basis points: {totalBps} / 10,000
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button className={styles.smallButton} type="button" onClick={addBucket}>
                  Add bucket
                </button>
                <button className={styles.secondaryButton} type="button" onClick={cancel}>
                  Cancel
                </button>
                <button
                  className={styles.primaryButton}
                  type="button"
                  disabled={saving}
                  onClick={save}
                >
                  {saving ? "Saving..." : "Create rule"}
                </button>
              </div>
            </div>
            {error ? <div className={styles.inlineError} style={{ marginTop: 10 }}>{error}</div> : null}
          </div>
        ) : null}
      </div>
    </>
  );
}

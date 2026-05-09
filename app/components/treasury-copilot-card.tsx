"use client";

import { useState, useTransition } from "react";
import styles from "@/app/dashboard/dashboard.module.css";

type ReconcileSummary = {
  headline: string;
  priority: "stable" | "watch" | "action_needed";
  actions: string[];
  risks: string[];
  notes: string[];
};

type BudgetSummary = {
  headline: string;
  status: "stable" | "watch" | "action_needed";
  actions: string[];
  observations: string[];
};

export function TreasuryCopilotCard() {
  const [reconcile, setReconcile] = useState<ReconcileSummary | null>(null);
  const [budget, setBudget] = useState<BudgetSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingKind, setPendingKind] = useState<"reconcile" | "budget" | null>(null);
  const [isPending, startTransition] = useTransition();

  const run = (path: string, kind: "reconcile" | "budget") => {
    setError(null);
    startTransition(async () => {
      setPendingKind(kind);
      try {
        const response = await fetch(path, { method: "POST" });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(payload.error || "Copilot request failed");
        }

        if (kind === "reconcile") {
          setReconcile(payload.summary as ReconcileSummary);
        } else {
          setBudget(payload.summary as BudgetSummary);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Copilot request failed");
      } finally {
        setPendingKind(null);
      }
    });
  };

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div>
          <div className={styles.cardEyebrow}>milestone 8</div>
          <div className={styles.cardTitle}>Treasury Copilot</div>
        </div>
        <span className={`${styles.tag} ${styles.tagBlue}`}>gpt-4o-mini</span>
      </div>
      <div className={styles.cardBody}>
        <div className={styles.ruleEditorActions} style={{ marginBottom: 12 }}>
          <div className={styles.helperText}>
            Short founder summaries only. No generic chat or automatic money movement.
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              type="button"
              className={styles.secondaryButton}
              disabled={isPending}
              onClick={() => run("/api/allocrail/copilot/reconcile-summary", "reconcile")}
            >
              {pendingKind === "reconcile" ? "Summarizing..." : "Summarize queue"}
            </button>
            <button
              type="button"
              className={styles.secondaryButton}
              disabled={isPending}
              onClick={() => run("/api/allocrail/copilot/budget-summary", "budget")}
            >
              {pendingKind === "budget" ? "Checking..." : "Explain budget risk"}
            </button>
          </div>
        </div>

        {!reconcile && !budget && !error ? (
          <div className={styles.helperText} style={{ marginBottom: 12 }}>
            Use queue summary for approvals and failures. Use budget guard for AI-agent credit or payout risk.
          </div>
        ) : null}

        {reconcile ? (
          <div className={styles.infoPanel} style={{ marginBottom: 12 }}>
            <div className={styles.infoPanelTitle}>
              Queue summary | {reconcile.priority.replaceAll("_", " ")}
            </div>
            <div className={styles.infoPanelText}>{reconcile.headline}</div>
            {reconcile.actions.length > 0 ? (
              <ul className={styles.copilotList}>
                {reconcile.actions.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
            {reconcile.risks.length > 0 ? (
              <div className={styles.ruleAudit}>Risks: {reconcile.risks.join(" | ")}</div>
            ) : null}
            {reconcile.notes.length > 0 ? (
              <div className={styles.ruleAudit}>Notes: {reconcile.notes.join(" | ")}</div>
            ) : null}
          </div>
        ) : null}

        {budget ? (
          <div className={styles.infoPanel}>
            <div className={styles.infoPanelTitle}>
              Budget guard | {budget.status.replaceAll("_", " ")}
            </div>
            <div className={styles.infoPanelText}>{budget.headline}</div>
            {budget.actions.length > 0 ? (
              <ul className={styles.copilotList}>
                {budget.actions.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
            {budget.observations.length > 0 ? (
              <div className={styles.ruleAudit}>Notes: {budget.observations.join(" | ")}</div>
            ) : null}
          </div>
        ) : null}

        {error ? <div className={styles.inlineError}>{error}</div> : null}
      </div>
    </div>
  );
}

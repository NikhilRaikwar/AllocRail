import { DashboardShell } from "@/app/components/dashboard-shell";
import { RulesManager } from "@/app/components/rules-manager";
import { listAllAllocationRules } from "@/app/lib/allocrail/event-store";
import {
  formatMoney,
} from "@/app/lib/allocrail/dashboard-data";
import styles from "@/app/dashboard/dashboard.module.css";

export default async function DashboardRulesPage() {
  const rules = await listAllAllocationRules();
  const primaryRule = rules[0] ?? null;

  return (
    <DashboardShell title="Allocation Rules">
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.eyebrow}>// allocation rules</div>
          <h1 className={styles.pageTitle}>
            Treasury <em>Rules.</em>
          </h1>
        </div>
      </div>

      <div
        className={styles.miniGrid}
        style={{ marginBottom: 18, paddingBottom: 0, borderBottom: "none" }}
      >
        <div className={styles.miniCard}>
          <div className={styles.miniLabel}>Active Rules</div>
          <div
            className={styles.statValue}
            style={{
              fontSize: 22,
              color: "var(--green)",
              marginBottom: 0,
            }}
          >
            {rules.filter((rule) => rule.enabled).length}
          </div>
        </div>
        <div className={styles.miniCard}>
          <div className={styles.miniLabel}>Total Buckets</div>
          <div
            className={styles.statValue}
            style={{ fontSize: 22, marginBottom: 0 }}
          >
            {rules.reduce((sum, rule) => sum + rule.buckets.length, 0)}
          </div>
        </div>
        <div className={styles.miniCard}>
          <div className={styles.miniLabel}>Daily Limit</div>
          <div
            className={styles.statValue}
            style={{
              fontSize: 22,
              color: "var(--green)",
              marginBottom: 0,
            }}
          >
            {primaryRule
              ? formatMoney(primaryRule.dailyLimitCents, "USD")
              : "Rs 0.00"}
          </div>
        </div>
      </div>

      <RulesManager initialRules={rules} />
    </DashboardShell>
  );
}

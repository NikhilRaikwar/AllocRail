import { DashboardShell } from "@/app/components/dashboard-shell";
import { FounderProfileSettings } from "@/app/components/founder-profile-settings";
import styles from "@/app/dashboard/dashboard.module.css";
import { requireCurrentFounder } from "@/app/lib/allocrail/founder";

export default async function DashboardSettingsPage() {
  const founder = await requireCurrentFounder();

  return (
    <DashboardShell title="Profile Settings">
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.eyebrow}>// founder settings</div>
          <h1 className={styles.pageTitle}>
            Profile <em>Settings.</em>
          </h1>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div>
            <div className={styles.cardEyebrow}>founder profile</div>
            <div className={styles.cardTitle}>Identity and workspace operator</div>
          </div>
          <span className={`${styles.tag} ${styles.tagGreen}`}>Supabase linked</span>
        </div>
        <FounderProfileSettings initialFounder={founder} />
      </div>
    </DashboardShell>
  );
}

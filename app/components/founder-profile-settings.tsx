"use client";

import { useState, useTransition } from "react";
import styles from "@/app/dashboard/dashboard.module.css";
import type { FounderProfile } from "@/app/lib/allocrail/types";

export function FounderProfileSettings({
  initialFounder,
}: {
  initialFounder: FounderProfile;
}) {
  const [fullName, setFullName] = useState(initialFounder.fullName);
  const [savedFounder, setSavedFounder] = useState(initialFounder);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const saveProfile = () => {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      try {
        const response = await fetch("/api/allocrail/founder-profile", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ fullName }),
        });

        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(payload.error || "Failed to save founder profile");
        }

        setSavedFounder(payload.founder as FounderProfile);
        setFullName((payload.founder as FounderProfile).fullName);
        setSuccess("Founder profile updated.");
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to save founder profile"
        );
      }
    });
  };

  return (
    <div className={styles.ruleEditorCard}>
      <div className={styles.formGrid}>
        <div className={styles.formField}>
          <label className={styles.formLabel} htmlFor="founder-full-name">
            Full name
          </label>
          <input
            id="founder-full-name"
            className={styles.formInput}
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            placeholder="Founder name"
          />
        </div>
        <div className={styles.formField}>
          <label className={styles.formLabel}>Email</label>
          <input
            className={styles.formInput}
            value={savedFounder.email}
            readOnly
            aria-readonly="true"
          />
        </div>
      </div>

      <div className={styles.ruleEditorActions}>
        <div className={styles.helperText}>
          This updates your founder name in both Supabase Auth metadata and the
          AllocRail founder profile table.
        </div>
        <button
          type="button"
          className={styles.smallButton}
          onClick={saveProfile}
          disabled={isPending}
        >
          {isPending ? "Saving..." : "Save profile"}
        </button>
      </div>

      {error ? <div className={styles.ruleAudit} style={{ color: "var(--red)" }}>{error}</div> : null}
      {success ? (
        <div className={styles.ruleAudit} style={{ color: "var(--green)" }}>
          {success}
        </div>
      ) : null}
    </div>
  );
}

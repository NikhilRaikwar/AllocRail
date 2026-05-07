"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AuthShell } from "@/app/components/auth/auth-shell";
import styles from "@/app/components/auth/auth-shell.module.css";
import { getSupabaseBrowserClient } from "@/app/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const title = useMemo(
    () => (
      <>
        Reset your
        <br />
        <em>password.</em>
      </>
    ),
    [],
  );

  return (
    <AuthShell
      eyebrow="// account recovery"
      title={title}
      copy="Enter your email address and we'll send you a link to reset your password."
    >
      <form
        className={styles.stack}
        onSubmit={async (event) => {
          event.preventDefault();
          setLoading(true);
          setError(null);
          setSuccess(null);
          const supabase = getSupabaseBrowserClient();
          const redirectTo = `${window.location.origin}/reset-password`;
          const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo,
          });
          setLoading(false);
          if (error) {
            setError(error.message);
            return;
          }
          setSuccess(`A reset link has been sent to ${email}.`);
        }}
      >
        <div className={styles.field}>
          <label className={styles.label} htmlFor="forgot-email">
            Email
          </label>
          <input
            id="forgot-email"
            type="email"
            className={styles.input}
            placeholder="founder@yourcompany.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />
        </div>

        {error ? <div className={styles.alertError}>{error}</div> : null}
        {success ? <div className={styles.alertSuccess}>{success}</div> : null}

        <button className={styles.button} disabled={loading} type="submit">
          {loading ? "Sending..." : "Send reset link"}
        </button>

        <div className={styles.secondaryLinks}>
          <Link href="/login" className={styles.link}>
            ← Back to login
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}

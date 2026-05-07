"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AuthShell } from "@/app/components/auth/auth-shell";
import styles from "@/app/components/auth/auth-shell.module.css";
import { getSupabaseBrowserClient } from "@/app/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const title = useMemo(
    () => (
      <>
        Set a new
        <br />
        <em>password.</em>
      </>
    ),
    [],
  );

  return (
    <AuthShell
      eyebrow="// password reset"
      title={title}
      copy="Choose a new password for your AllocRail founder account."
    >
      <form
        className={styles.stack}
        onSubmit={async (event) => {
          event.preventDefault();
          setLoading(true);
          setError(null);
          setSuccess(null);
          const supabase = getSupabaseBrowserClient();
          const { error } = await supabase.auth.updateUser({ password });
          setLoading(false);
          if (error) {
            setError(error.message);
            return;
          }
          setSuccess("Password updated. Redirecting to your treasury dashboard...");
          window.setTimeout(() => {
            router.push("/dashboard");
            router.refresh();
          }, 900);
        }}
      >
        <div className={styles.field}>
          <label className={styles.label} htmlFor="reset-password">
            New password
          </label>
          <div className={styles.inputWrap}>
            <input
              id="reset-password"
              type={showPassword ? "text" : "password"}
              className={`${styles.input} ${styles.inputPassword}`}
              placeholder="Min. 8 characters"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />
            <button
              type="button"
              className={styles.fieldEye}
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "🙈" : "👁"}
            </button>
          </div>
        </div>

        {error ? <div className={styles.alertError}>{error}</div> : null}
        {success ? <div className={styles.alertSuccess}>{success}</div> : null}

        <button className={styles.button} disabled={loading} type="submit">
          {loading ? "Updating..." : "Update password"}
        </button>

        <div className={styles.secondaryLinks}>
          <Link href="/login" className={styles.link}>
            Back to login
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}

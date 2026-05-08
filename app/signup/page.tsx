"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AuthShell } from "@/app/components/auth/auth-shell";
import styles from "@/app/components/auth/auth-shell.module.css";
import { getSupabaseBrowserClient } from "@/app/lib/supabase/client";

function GoogleMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const title = useMemo(
    () => (
      <>
        Create your
        <br />
        <em>workspace.</em>
      </>
    ),
    [],
  );

  return (
    <AuthShell
      eyebrow="// founder onboarding"
      title={title}
      copy="Create an AllocRail founder account. After email confirmation, you can access the dashboard and connect your treasury wallet there."
    >
      <form
        className={styles.stack}
        onSubmit={async (event) => {
          event.preventDefault();
          setLoading(true);
          setError(null);
          setSuccess(null);
          const supabase = getSupabaseBrowserClient();
          const redirectTo = `${window.location.origin}/auth/callback?next=/dashboard`;
          const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: redirectTo,
              data: {
                full_name: fullName,
              },
            },
          });
          setLoading(false);
          if (error) {
            setError(error.message);
            return;
          }
          setSuccess(
            "Account created. Check your email to confirm your address, then access your treasury dashboard.",
          );
        }}
      >
        <div className={styles.field}>
          <label className={styles.label} htmlFor="signup-name">
            Full name
          </label>
          <input
            id="signup-name"
            type="text"
            className={styles.input}
            placeholder="Your name"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            autoComplete="name"
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="signup-email">
            Email
          </label>
          <input
            id="signup-email"
            type="email"
            className={styles.input}
            placeholder="founder@yourcompany.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="signup-password">
            Password
          </label>
          <div className={styles.inputWrap}>
            <input
              id="signup-password"
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
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        {error ? <div className={styles.alertError}>{error}</div> : null}
        {success ? <div className={styles.alertSuccess}>{success}</div> : null}

        <button className={styles.button} disabled={loading} type="submit">
          {loading ? "Creating..." : "Create account"}
        </button>

        <div className={styles.secondaryLinks}>
          <Link href="/login" className={styles.link}>
            Already have an account?{" "}
            <span className={styles.linkAccent}>{"Login ->"}</span>
          </Link>
        </div>

        <div className={styles.divider}>or sign up with</div>

        <div className={styles.socialBtns}>
          <button
            type="button"
            className={`${styles.socialBtn} ${styles.socialBtnDisabled}`}
            disabled
            title="Google auth not wired yet"
          >
            <span className={styles.socialBtnIcon}>
              <GoogleMark />
            </span>
            Google
          </button>
          <button
            type="button"
            className={`${styles.socialBtn} ${styles.socialBtnDisabled}`}
            disabled
            title="Phantom connect stays inside the dashboard"
          >
            <span className={styles.socialBtnIcon}>Ph</span>
            Phantom
          </button>
        </div>
      </form>
    </AuthShell>
  );
}

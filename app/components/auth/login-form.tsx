"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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

export function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const title = useMemo(
    () => (
      <>
        Login to
        <br />
        <em>your treasury.</em>
      </>
    ),
    [],
  );

  return (
    <AuthShell
      eyebrow="// founder access"
      title={title}
      copy="Sign in to your AllocRail workspace. Wallet connect stays a treasury utility inside the dashboard."
    >
      <form
        className={styles.stack}
        onSubmit={async (event) => {
          event.preventDefault();
          setLoading(true);
          setError(null);
          const supabase = getSupabaseBrowserClient();
          const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          setLoading(false);
          if (error) {
            setError(error.message);
            return;
          }
          router.push(next);
          router.refresh();
        }}
      >
        <div className={styles.field}>
          <label className={styles.label} htmlFor="login-email">
            Email
          </label>
          <input
            id="login-email"
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
          <label className={styles.label} htmlFor="login-password">
            Password
          </label>
          <div className={styles.inputWrap}>
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              className={`${styles.input} ${styles.inputPassword}`}
              placeholder="••••••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
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

        <button className={styles.button} disabled={loading} type="submit">
          {loading ? "Logging in..." : "Login"}
        </button>

        <div className={styles.secondaryLinks}>
          <Link href="/signup" className={styles.link}>
            Create account
          </Link>
          <Link href="/forgot-password" className={styles.linkMuted}>
            Forgot password
          </Link>
        </div>

        <div className={styles.divider}>or continue with</div>

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
            <span className={styles.socialBtnIcon}>◎</span>
            Phantom
          </button>
        </div>
      </form>
    </AuthShell>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/app/lib/supabase/client";
import styles from "@/app/dashboard/dashboard.module.css";

export function AuthStatus() {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    supabase.auth.getUser().then(({ data }: { data: { user: { email?: string | null } | null } }) => {
      setEmail(data.user?.email ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event: unknown, session: { user?: { email?: string | null } } | null) => {
      setEmail(session?.user?.email ?? null);
      setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <span className={styles.authMeta}>Auth</span>;
  if (!email) {
    return (
      <Link href="/login" className={styles.authLink}>
        Login
      </Link>
    );
  }

  return <span className={styles.authMeta}>{email}</span>;
}

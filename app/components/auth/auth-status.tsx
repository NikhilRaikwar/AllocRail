"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/app/lib/supabase/client";
import styles from "@/app/dashboard/dashboard.module.css";

export function AuthStatus() {
  const [email, setEmail] = useState<string | null>(null);
  const [fullName, setFullName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    const syncFounder = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      setEmail(user?.email ?? null);

      if (!user) {
        setFullName(null);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/allocrail/founder-profile");
        const payload = await response.json().catch(() => ({}));
        if (response.ok && payload.founder?.fullName) {
          setFullName(payload.founder.fullName as string);
        } else {
          setFullName(user.user_metadata?.full_name ?? null);
        }
      } catch {
        setFullName(user.user_metadata?.full_name ?? null);
      }

      setLoading(false);
    };

    void syncFounder();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (
        _event: unknown,
        session:
          | {
              user?: {
                email?: string | null;
                user_metadata?: { full_name?: string | null } | null;
              };
            }
          | null
      ) => {
        setEmail(session?.user?.email ?? null);
        if (!session?.user) {
          setFullName(null);
          setLoading(false);
          return;
        }

        void syncFounder();
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

  return (
    <span className={styles.authMeta} title={email}>
      {fullName && fullName.trim().length > 0 ? fullName : email}
    </span>
  );
}

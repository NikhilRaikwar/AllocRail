"use client";

import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/app/lib/supabase/client";
import styles from "@/app/dashboard/dashboard.module.css";

export function SignOutButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      className={styles.authLinkButton}
      onClick={async () => {
        const supabase = getSupabaseBrowserClient();
        await supabase.auth.signOut();
        router.push("/");
        router.refresh();
      }}
    >
      Sign out
    </button>
  );
}

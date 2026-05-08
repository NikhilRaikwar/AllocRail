"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Instrument_Serif,
  Instrument_Sans,
  Courier_Prime,
} from "next/font/google";
import { ThemeToggle } from "@/app/components/theme-toggle";
import { ClusterSelect } from "@/app/components/cluster-select";
import { WalletButton } from "@/app/components/wallet-button";
import { CheckoutButton } from "@/app/components/checkout-button";
import { AuthStatus } from "@/app/components/auth/auth-status";
import { SignOutButton } from "@/app/components/auth/sign-out-button";
import { demoAllocationRule } from "@/app/lib/allocrail/demo-data";
import styles from "@/app/dashboard/dashboard.module.css";

const instrumentSerif = Instrument_Serif({
  variable: "--font-dashboard-serif",
  subsets: ["latin"],
  weight: "400",
});

const instrumentSans = Instrument_Sans({
  variable: "--font-dashboard-sans",
  subsets: ["latin"],
});

const courierPrime = Courier_Prime({
  variable: "--font-dashboard-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const navItems = [
  { href: "/dashboard", label: "Overview", icon: "O" },
  { href: "/dashboard/events", label: "Revenue Events", icon: "$" },
  { href: "/dashboard/payout-intents", label: "Payout Intents", icon: ">" },
  { href: "/dashboard/receipts", label: "Receipts", icon: "R" },
  { href: "/dashboard/rules", label: "Allocation Rules", icon: "=" },
  { href: "/dashboard/settings", label: "Profile Settings", icon: "P" },
];

type DashboardShellProps = {
  title: string;
  children: React.ReactNode;
};

export function DashboardShell({ title, children }: DashboardShellProps) {
  const pathname = usePathname();
  const metadata = {
    workspace_id: demoAllocationRule.workspaceId,
    merchant_id: demoAllocationRule.merchantId,
    rule_id: demoAllocationRule.id,
    product_tag: demoAllocationRule.productTag,
  };

  return (
    <div
      className={[
        styles.dashboardRoot,
        instrumentSerif.variable,
        instrumentSans.variable,
        courierPrime.variable,
      ].join(" ")}
      style={{ fontFamily: "var(--font-dashboard-sans), var(--font-sans)" }}
    >
      <nav className={styles.topnav}>
        <Link href="/" className={styles.brand}>
          AllocRail
        </Link>
        <div className={styles.navSep} />
        <span className={styles.navPageTitle}>Founder Dashboard</span>
        <div className={styles.navRight}>
          <div className={styles.authWrap}>
            <AuthStatus />
            <SignOutButton />
          </div>
          <div className={`${styles.controlWrap} ${styles.themeWrap}`}>
            <ThemeToggle />
          </div>
          <div className={`${styles.controlWrap} ${styles.clusterWrap}`}>
            <ClusterSelect />
          </div>
          <div className={`${styles.controlWrap} ${styles.walletWrap}`}>
            <WalletButton />
          </div>
        </div>
      </nav>

      <div className={styles.shell}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarActionCard}>
            <div className={styles.sidebarActionTitle}>// demo checkout</div>
            <CheckoutButton
              metadata={metadata}
              email="founder-demo@allocrail.dev"
              name="AllocRail Demo Customer"
              label="Start Demo Checkout"
              className=""
              buttonClassName={styles.sidebarCheckoutButton}
              sessionClassName={styles.sidebarCheckoutMeta}
              statusClassName={styles.sidebarCheckoutStatus}
              errorClassName={styles.sidebarCheckoutError}
            />
          </div>

          <span className={styles.sidebarLabel}>// treasury</span>
          {navItems.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.sidebarLink} ${
                  active ? styles.sidebarLinkActive : ""
                }`}
              >
                <span className={styles.sidebarIcon}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}

          <span className={styles.sidebarLabel}>// solana</span>
          <div className={styles.sidebarLink}>
            <span className={styles.sidebarIcon}>S</span>
            Devnet USDC
          </div>
          <div className={styles.sidebarLink}>
            <span className={styles.sidebarIcon}>V</span>
            Vault Status
          </div>

          <div className={styles.sidebarBottom}>
            <div className={styles.webhookStatus}>
              <span className={styles.pip} />
              <span className={styles.webhookText}>Webhook active</span>
            </div>
            <div className={styles.sidebarLink}>
              <span className={styles.sidebarIcon}>T</span>
              <span
                className={styles.webhookText}
                style={{ color: "var(--ink-muted)" }}
              >
                Dodo test_mode
              </span>
            </div>
          </div>
        </aside>

        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
}

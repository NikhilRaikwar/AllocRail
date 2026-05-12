import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: {
    default: "Dashboard",
    template: "%s | AllocRail Dashboard",
  },
  description: "Founder dashboard for revenue events, payout intents, receipts, allocation rules, and treasury settings.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

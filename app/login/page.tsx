import type { Metadata } from "next";
import { LoginForm } from "@/app/components/auth/login-form";

export const metadata: Metadata = {
  title: "Login",
  description: "Sign in to AllocRail to manage treasury routes, payout intents, receipts, and founder settings.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  return <LoginForm next={params.next ?? "/dashboard"} />;
}

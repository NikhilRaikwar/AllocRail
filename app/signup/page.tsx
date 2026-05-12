import type { Metadata } from "next";
import { SignupForm } from "@/app/components/auth/signup-form";

export const metadata: Metadata = {
  title: "Sign Up",
  description: "Create an AllocRail founder account to route Dodo revenue into Solana treasury payouts.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  return <SignupForm next={params.next ?? "/dashboard"} />;
}

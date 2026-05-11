import { SignupForm } from "@/app/components/auth/signup-form";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  return <SignupForm next={params.next ?? "/dashboard"} />;
}

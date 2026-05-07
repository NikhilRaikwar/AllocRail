import { LoginForm } from "@/app/components/auth/login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  return <LoginForm next={params.next ?? "/dashboard"} />;
}

import Link from "next/link";

export default function CheckoutSuccessPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6">
      <p className="text-sm font-medium text-foreground/55">
        Dodo checkout complete
      </p>
      <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">
        Revenue event received.
      </h1>
      <p className="mt-5 text-base leading-7 text-foreground/60">
        The next AllocRail step is the verified webhook: Dodo confirms the
        payment, AllocRail matches routing metadata, creates payout intents,
        and settles the route with Solana devnet USDC.
      </p>
      <Link
        href="/"
        className="mt-8 w-fit rounded-lg bg-foreground px-4 py-2 text-sm font-semibold text-background transition hover:opacity-90"
      >
        Back to dashboard
      </Link>
    </main>
  );
}

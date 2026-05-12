import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { Providers } from "./components/providers";

const siteUrl = "https://www.allocrail.dev";
const siteTitle = "AllocRail | Post-Revenue Treasury Routing on Solana";
const siteDescription =
  "AllocRail is the programmable treasury layer after Dodo Payments revenue lands. Route verified billing events into founder-controlled Solana USDC payout intents with receipt-backed proof.";
const siteKeywords = [
  "AllocRail",
  "Dodo Payments",
  "Solana",
  "USDC",
  "treasury routing",
  "post-revenue treasury",
  "stablecoin payouts",
  "founder treasury",
  "SaaS treasury",
  "AI agent budgets",
  "webhook settlement",
  "Superteam India",
  "Solana Frontier",
];

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteTitle,
    template: "%s | AllocRail",
  },
  description: siteDescription,
  keywords: siteKeywords,
  applicationName: "AllocRail",
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "AllocRail",
    title: siteTitle,
    description: siteDescription,
    images: [
      {
        url: "/banner.png",
        width: 1200,
        height: 630,
        alt: "AllocRail landing page hero banner",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    creator: "@AllocRail",
    images: ["/banner.png"],
  },
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${geistMono.variable} antialiased`}>
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  );
}

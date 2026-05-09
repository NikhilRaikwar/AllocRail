"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import styles from "./auth-shell.module.css";

const flowSteps = [
  { number: "01", icon: "💳", label: "Dodo checkout", arrow: "→" },
  { number: "02", icon: "🔐", label: "Verified webhook", arrow: "→" },
  { number: "03", icon: "⚡", label: "Allocation rule match", arrow: "→" },
  { number: "04", icon: "◎", label: "Solana USDC settlement", arrow: "→" },
  { number: "05", icon: "◈", label: "Receipt + proof", arrow: "✓" },
];

export function AuthShell({
  eyebrow,
  title,
  copy,
  children,
}: {
  eyebrow: string;
  title: React.ReactNode;
  copy: string;
  children: React.ReactNode;
}) {
  const [dark, setDark] = useState(true);
  const [activeStep, setActiveStep] = useState(1);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveStep((current) => (current + 1) % flowSteps.length);
    }, 1800);
    return () => window.clearInterval(timer);
  }, []);

  const themeIcon = useMemo(() => (dark ? "🌙" : "☀️"), [dark]);

  return (
    <main className={`${styles.page} ${dark ? styles.dark : ""}`}>
      <div className={styles.shell}>
        <aside className={styles.brandPanel}>
          <div className={styles.brandTop}>
            <Link href="/" className={styles.brandLogo}>
              <span className={styles.brandLogoName}>AllocRail</span>
            </Link>

            <h1 className={styles.brandHeadline}>
              Dodo collects.
              <br />
              AllocRail <em>routes.</em>
              <br />
              Solana settles.
            </h1>

            <p className={styles.brandSub}>
              Turn every Dodo payment event into programmable Solana USDC
              treasury splits through founder-defined routing logic and
              explorer-linked proof.
            </p>
          </div>

          <div className={styles.brandFlow}>
            {flowSteps.map((step, index) => (
              <div
                key={step.number}
                className={`${styles.flowStep} ${
                  activeStep === index ? styles.flowActive : ""
                }`}
              >
                <span className={styles.flowNum}>{step.number}</span>
                <span className={styles.flowIcon}>{step.icon}</span>
                <span className={styles.flowLabel}>{step.label}</span>
                <span className={styles.flowArrow}>{step.arrow}</span>
              </div>
            ))}
          </div>

          <div className={styles.brandBottom}>
            <div className={styles.brandBottomRow}>
              <span className={styles.bottomBadge}>
                <span className={styles.badgePip}></span>
                Solana devnet live
              </span>
              <span className={styles.bottomBadge}>Dodo Test Mode</span>
              <span
                className={`${styles.bottomBadge} ${styles.bottomBadgePush}`}
              >
                Superteam India × Solana Frontier
              </span>
            </div>
          </div>
        </aside>

        <section className={styles.formPanel}>
          <div className={styles.formPanelTop}>
            <span className={styles.formPanelBrand}>AllocRail</span>
            <button
              className={styles.themeBtn}
              type="button"
              title="Toggle theme"
              onClick={() => setDark((value) => !value)}
            >
              {themeIcon}
            </button>
          </div>

          <div className={styles.formContent}>
            <div className={styles.eyebrow}>{eyebrow}</div>
            <h1 className={styles.title}>{title}</h1>
            <p className={styles.copy}>{copy}</p>
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}

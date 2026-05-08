import type { AllocRailReceipt } from "./types";
import { getAppEnvironment } from "./env";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatMoney(cents: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency}`;
  }
}

function formatTimestamp(value: string) {
  try {
    return new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function shortSignature(value?: string) {
  if (!value) return "pending";
  if (value.length <= 56) return value;
  return value.slice(0, 56);
}

function getSettlementStatus(receipt: AllocRailReceipt) {
  if (receipt.payoutIntents.every((intent) => intent.status === "confirmed")) {
    return "Confirmed";
  }
  if (receipt.payoutIntents.some((intent) => intent.status === "quarantined")) {
    return "Quarantined";
  }
  if (receipt.payoutIntents.some((intent) => intent.status === "rejected")) {
    return "Approval Blocked";
  }
  if (receipt.payoutIntents.some((intent) => intent.status === "submitted")) {
    return "Submitting";
  }
  if (receipt.payoutIntents.some((intent) => intent.status === "failed")) {
    return "Partial Failure";
  }
  return "Pending Settlement";
}

function statusClass(status: string) {
  if (status === "confirmed") return "tag-confirmed";
  if (status === "quarantined" || status === "rejected" || status === "failed") {
    return "tag-failed";
  }
  return "tag-pending";
}

function bucketColor(kind: string) {
  if (kind === "contractor_escrow") return "#1a6b4a";
  if (kind === "tax_reserve") return "#9b6e1a";
  if (kind === "founder_share") return "#5b3fa6";
  return "#3b6bb4";
}

function bucketDotClass(kind: string) {
  if (kind === "contractor_escrow") return "dot-green";
  if (kind === "tax_reserve") return "dot-amber";
  if (kind === "founder_share") return "dot-purple";
  return "dot-blue";
}

function bucketLabel(receipt: AllocRailReceipt, kind: string) {
  return (
    receipt.allocationRule.buckets.find((entry) => entry.kind === kind)?.label ??
    kind.replaceAll("_", " ")
  );
}

function settlementTotal(receipt: AllocRailReceipt) {
  return receipt.payoutIntents.reduce((sum, intent) => sum + intent.amountCents, 0);
}

export function buildAllocRailReceiptHtml(receipt: AllocRailReceipt) {
  const env = getAppEnvironment();
  const appUrl = env.appUrl.replace(/\/$/, "");
  const status = getSettlementStatus(receipt);
  const total = settlementTotal(receipt);
  const paymentReceiptHref = receipt.revenueEvent.dodoPaymentId
    ? `${appUrl}/api/allocrail/payments/${receipt.revenueEvent.dodoPaymentId}/receipt`
    : null;
  const refundReceiptHref = receipt.revenueEvent.dodoRefundId
    ? `${appUrl}/api/allocrail/refunds/${receipt.revenueEvent.dodoRefundId}/receipt`
    : null;
  const auditDownloadHref = `${appUrl}/api/allocrail/receipts/${receipt.id}/download`;
  const receiptsHref = `${appUrl}/dashboard/receipts`;

  const allocationLegend = receipt.allocationRule.buckets
    .map(
      (bucket) => `
        <span class="legend-item"><span class="legend-dot" style="background:${bucketColor(
          bucket.kind
        )};"></span>${escapeHtml(bucket.label)} ${Math.round(
          bucket.percentageBps / 100
        )}%</span>
      `
    )
    .join("");

  const allocationSegments = receipt.allocationRule.buckets
    .map(
      (bucket) => `
        <div class="alloc-seg" style="width:${bucket.percentageBps / 100}%;background:${bucketColor(
          bucket.kind
        )};"></div>
      `
    )
    .join("");

  const intentRows = receipt.payoutIntents
    .map((intent) => {
      const txContent = intent.explorerUrl
        ? `Tx:&nbsp;<a href="${escapeHtml(intent.explorerUrl)}" target="_blank" rel="noreferrer">${escapeHtml(
            shortSignature(intent.solanaSignature)
          )}</a>`
        : escapeHtml(intent.failureReason ?? "Waiting for execution");

      return `
        <div class="intent-row">
          <div class="intent-dot-wrap">
            <div class="intent-dot ${bucketDotClass(intent.bucketKind)}"></div>
          </div>
          <div class="intent-info">
            <div class="intent-label">${escapeHtml(
              bucketLabel(receipt, intent.bucketKind)
            )}</div>
            <div class="intent-tx">${txContent}</div>
          </div>
          <div class="intent-amount-col">
            <div class="intent-usdc">${escapeHtml(
              formatMoney(intent.amountCents, intent.currency).replace("USDC", "").trim()
            )}</div>
            <div class="intent-currency">${escapeHtml(intent.currency)}</div>
          </div>
          <div class="intent-status-col">
            <span class="tag ${statusClass(intent.status)}"><span class="tag-dot"></span>${escapeHtml(
              intent.status
            )}</span>
          </div>
        </div>
      `;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>AllocRail - Audit Receipt</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Instrument+Sans:wght@300;400;500;600&family=Courier+Prime:wght@400;700&display=swap" rel="stylesheet" />
<style>
  :root {
    --cream:#f5f0e8; --cream-dark:#ede7d9; --cream-darker:#e3dac8; --ink:#1a1714;
    --ink-soft:#3d3830; --ink-muted:#7a7268; --ink-faint:#b5afa6; --green:#1a6b4a;
    --green-light:#2a8a60; --green-pale:#d4eae0; --amber:#9b6e1a; --amber-pale:#f5edd4;
    --purple:#5b3fa6; --purple-pale:#eae4f5; --blue:#3b6bb4; --blue-pale:#eaf0f8;
    --red-pale:#f5e4e4; --border:rgba(26,23,20,0.12); --border-strong:rgba(26,23,20,0.22);
    --serif:'Instrument Serif', Georgia, serif; --sans:'Instrument Sans', system-ui, sans-serif;
    --mono:'Courier Prime', 'Courier New', monospace;
  }
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  body{font-family:var(--sans);background:var(--cream);color:var(--ink);min-height:100vh;padding:28px 20px 36px;position:relative}
  body::before{content:"";position:fixed;inset:0;pointer-events:none;z-index:0;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='400' height='400' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E");opacity:.5}
  .toolbar{position:relative;z-index:10;max-width:720px;margin:0 auto 18px;display:flex;align-items:center;justify-content:space-between;gap:12px}
  .toolbar-brand{font-family:var(--serif);font-size:20px;font-style:italic;letter-spacing:-.3px;color:var(--ink);text-decoration:none}
  .toolbar-actions{display:flex;gap:10px;align-items:center}
  .btn-toolbar{display:inline-flex;align-items:center;gap:7px;padding:8px 16px;border-radius:8px;border:1px solid var(--border-strong);background:rgba(255,253,250,.8);color:var(--ink-soft);font-family:var(--sans);font-size:12px;font-weight:500;cursor:pointer;transition:all .2s;backdrop-filter:blur(8px);text-decoration:none}
  .btn-toolbar:hover{background:var(--cream-darker);color:var(--ink)}
  .btn-toolbar-primary{background:var(--ink);color:var(--cream);border-color:var(--ink)}
  .btn-toolbar-primary:hover{opacity:.85}
  .receipt-wrap{position:relative;z-index:1;max-width:720px;margin:0 auto;animation:receiptIn .5s ease both .1s}
  @keyframes receiptIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
  .receipt{background:#fff;border:1px solid var(--border-strong);border-radius:16px;overflow:hidden;box-shadow:0 24px 80px rgba(26,23,20,.14),0 4px 20px rgba(26,23,20,.08)}
  .receipt-header{background:var(--ink);padding:28px 30px 24px;position:relative;overflow:hidden}
  .receipt-header::before{content:"";position:absolute;inset:0;pointer-events:none;background-image:linear-gradient(to right, rgba(245,240,232,.06) 1px, transparent 1px),linear-gradient(to bottom, rgba(245,240,232,.06) 1px, transparent 1px);background-size:40px 40px}
  .receipt-header::after{content:"";position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse 50% 60% at 80% 50%, rgba(26,107,74,.18) 0%, transparent 70%)}
  .receipt-header-inner{position:relative;z-index:1;display:flex;align-items:flex-start;justify-content:space-between;gap:20px}
  .receipt-brand{display:flex;align-items:center;gap:10px;margin-bottom:14px}
  .receipt-brand-name{font-family:var(--serif);font-size:22px;font-style:italic;letter-spacing:-.4px;color:#f5f0e8}
  .receipt-eyebrow{font-family:var(--mono);font-size:9px;letter-spacing:.16em;text-transform:uppercase;color:rgba(245,240,232,.45);margin-bottom:8px}
  .receipt-main-title{font-family:var(--serif);font-size:28px;font-style:italic;letter-spacing:-1px;color:#f5f0e8;margin-bottom:4px}
  .receipt-subtitle{font-family:var(--mono);font-size:11px;color:rgba(245,240,232,.50);letter-spacing:.02em}
  .receipt-status-badge{display:flex;align-items:center;gap:7px;padding:8px 14px;border-radius:30px;border:1px solid rgba(26,107,74,.40);background:rgba(26,107,74,.15);flex-shrink:0}
  .status-pip{width:7px;height:7px;border-radius:50%;background:#14f195;box-shadow:0 0 0 3px rgba(20,241,149,.20);animation:pip 2s infinite}
  @keyframes pip{0%,100%{box-shadow:0 0 0 3px rgba(20,241,149,.20)}50%{box-shadow:0 0 0 6px transparent}}
  .status-label{font-family:var(--mono);font-size:10px;letter-spacing:.10em;text-transform:uppercase;color:#14f195;font-weight:700}
  .receipt-amount-block{margin-top:20px;display:flex;align-items:flex-end;gap:18px;flex-wrap:wrap}
  .receipt-source-amount{font-family:var(--serif);font-size:42px;font-style:italic;letter-spacing:-2px;color:#f5f0e8;line-height:1}
  .receipt-source-label{font-family:var(--mono);font-size:10px;letter-spacing:.10em;text-transform:uppercase;color:rgba(245,240,232,.45);margin-bottom:8px}
  .receipt-arrow{font-size:20px;color:rgba(245,240,232,.30);margin-bottom:8px}
  .receipt-settled-amount{font-family:var(--serif);font-size:28px;font-style:italic;letter-spacing:-1px;color:#14f195;line-height:1}
  .receipt-settled-label{font-family:var(--mono);font-size:10px;letter-spacing:.10em;text-transform:uppercase;color:rgba(20,241,149,.55);margin-bottom:8px}
  .receipt-meta{display:grid;grid-template-columns:1fr 1fr;gap:0;border-bottom:1px solid var(--border)}
  .meta-cell{padding:14px 18px;border-right:1px solid var(--border);border-bottom:1px solid var(--border)}
  .meta-cell:nth-child(even){border-right:none}
  .meta-cell:nth-last-child(-n+2){border-bottom:none}
  .meta-key{font-family:var(--mono);font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--ink-faint);margin-bottom:5px}
  .meta-val{font-family:var(--mono);font-size:11.5px;color:var(--ink-soft);word-break:break-all;line-height:1.5}
  .meta-val-highlight{font-family:var(--serif);font-style:italic;font-size:15px;color:var(--green)}
  .meta-links{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}
  .meta-link{display:inline-flex;align-items:center;padding:5px 9px;border-radius:7px;border:1px solid var(--border-strong);background:var(--cream-dark);color:var(--ink-soft);font-family:var(--sans);font-size:11px;text-decoration:none}
  .section-header{padding:14px 18px 12px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between}
  .section-eyebrow{font-family:var(--mono);font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-muted);margin-bottom:4px}
  .section-title{font-family:var(--serif);font-style:italic;font-size:18px;letter-spacing:-.4px;color:var(--ink)}
  .section-count{font-family:var(--mono);font-size:10px;color:var(--ink-faint)}
  .intent-row{display:grid;grid-template-columns:28px 1fr auto auto;align-items:start;gap:14px;padding:14px 18px;border-bottom:1px solid var(--border);transition:background .15s}
  .intent-row:last-child{border-bottom:none}
  .intent-row:hover{background:rgba(26,23,20,.02)}
  .intent-dot-wrap{padding-top:3px}
  .intent-dot{width:10px;height:10px;border-radius:50%}
  .dot-green{background:var(--green)} .dot-amber{background:var(--amber)} .dot-purple{background:var(--purple)} .dot-blue{background:var(--blue)}
  .intent-label{font-size:13px;font-weight:500;color:var(--ink);margin-bottom:4px}
  .intent-tx{font-family:var(--mono);font-size:9.5px;color:var(--ink-faint);word-break:break-all;line-height:1.55}
  .intent-tx a{color:var(--blue);text-decoration:none;border-bottom:1px dotted var(--blue);transition:opacity .15s}
  .intent-tx a:hover{opacity:.7}
  .intent-amount-col{text-align:right;flex-shrink:0}
  .intent-usdc{font-family:var(--serif);font-style:italic;font-size:16px;color:var(--green);white-space:nowrap}
  .intent-currency{font-family:var(--mono);font-size:9px;color:var(--ink-faint);letter-spacing:.08em;text-transform:uppercase;margin-top:2px}
  .intent-status-col{flex-shrink:0;padding-top:2px}
  .tag{display:inline-flex;align-items:center;gap:5px;font-family:var(--mono);font-size:9px;letter-spacing:.08em;text-transform:uppercase;font-weight:700;padding:3px 8px;border-radius:4px;white-space:nowrap}
  .tag-confirmed{background:var(--green-pale);color:var(--green)}
  .tag-pending{background:var(--amber-pale);color:var(--amber)}
  .tag-failed{background:var(--red-pale);color:#8b2e2e}
  .tag-dot{width:5px;height:5px;border-radius:50%;background:currentColor}
  .settlement-row{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;background:var(--cream-dark);border-top:1px solid var(--border-strong)}
  .settlement-label{font-family:var(--mono);font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-muted);margin-bottom:4px}
  .settlement-rule{font-size:13px;font-weight:500;color:var(--ink-soft)}
  .settlement-total-block{text-align:right}
  .settlement-total-label{font-family:var(--mono);font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-muted);margin-bottom:4px}
  .settlement-total{font-family:var(--serif);font-style:italic;font-size:24px;letter-spacing:-1px;color:var(--green)}
  .alloc-bar-section{padding:14px 18px;border-top:1px solid var(--border)}
  .alloc-bar-label{font-family:var(--mono);font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:var(--ink-muted);margin-bottom:10px}
  .alloc-bar-track{height:8px;border-radius:4px;background:var(--cream-darker);overflow:hidden;display:flex;margin-bottom:10px}
  .alloc-seg{height:100%;transition:width .6s ease}
  .alloc-legend{display:flex;gap:16px;flex-wrap:wrap}
  .legend-item{display:flex;align-items:center;gap:5px;font-family:var(--mono);font-size:10px;color:var(--ink-muted)}
  .legend-dot{width:7px;height:7px;border-radius:50%}
  .receipt-footer{padding:12px 18px;border-top:1px solid var(--border-strong);background:var(--cream-dark);display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}
  .footer-left{font-family:var(--mono);font-size:9px;color:var(--ink-faint);line-height:1.45}
  .footer-right{display:flex;flex-direction:column;align-items:flex-end;gap:2px}
  .footer-chain{display:flex;align-items:center;gap:6px;font-family:var(--mono);font-size:9px;letter-spacing:.10em;text-transform:uppercase;color:var(--ink-faint)}
  .footer-chain-dot{width:6px;height:6px;border-radius:50%;background:#14f195}
  .footer-dodo{font-family:var(--mono);font-size:9px;color:var(--ink-faint);letter-spacing:.08em}
  @media print{
    body{background:#fff!important;padding:0!important}
    body::before{display:none}
    .toolbar{display:none!important}
    .receipt-wrap{max-width:100%}
    .receipt{border:none;border-radius:0;box-shadow:none}
    .receipt-header,.receipt-meta,.alloc-bar-section,.settlement-row,.receipt-footer{-webkit-print-color-adjust:exact;print-color-adjust:exact}
    .intent-row:hover{background:none}
    @page{margin:8mm;size:A4 portrait}
  }
</style>
</head>
<body>
<div class="toolbar">
  <a href="${receiptsHref}" class="toolbar-brand">AllocRail</a>
  <div class="toolbar-actions">
    <a href="${receiptsHref}" class="btn-toolbar">&larr; Receipts</a>
    <a href="${auditDownloadHref}" class="btn-toolbar btn-toolbar-primary" download>Download</a>
  </div>
</div>
<div class="receipt-wrap">
  <div class="receipt">
    <div class="receipt-header">
      <div class="receipt-header-inner">
        <div>
          <div class="receipt-brand">
            <span class="receipt-brand-name">AllocRail</span>
          </div>
          <div class="receipt-eyebrow">// audit receipt</div>
          <div class="receipt-main-title">Treasury Settlement</div>
          <div class="receipt-subtitle">Dodo Revenue &rarr; Solana USDC Routes</div>
        </div>
        <div class="receipt-status-badge">
          <span class="status-pip"></span>
          <span class="status-label">${escapeHtml(status)}</span>
        </div>
      </div>
      <div class="receipt-amount-block">
        <div>
          <div class="receipt-source-label">Source Revenue</div>
          <div class="receipt-source-amount">${escapeHtml(
            formatMoney(receipt.revenueEvent.amountCents, receipt.revenueEvent.currency)
          )}</div>
        </div>
        <div class="receipt-arrow">&rarr;</div>
        <div>
          <div class="receipt-settled-label">Settled USDC</div>
          <div class="receipt-settled-amount">${escapeHtml(
            formatMoney(total, "USDC")
          )}</div>
        </div>
      </div>
    </div>
    <div class="receipt-meta">
      <div class="meta-cell">
        <div class="meta-key">Receipt ID</div>
        <div class="meta-val">${escapeHtml(receipt.id)}</div>
      </div>
      <div class="meta-cell">
        <div class="meta-key">Receipt Time</div>
        <div class="meta-val">${escapeHtml(formatTimestamp(receipt.revenueEvent.receivedAt))}</div>
      </div>
      <div class="meta-cell">
        <div class="meta-key">Dodo Payment ID</div>
        <div class="meta-val">${escapeHtml(receipt.revenueEvent.dodoPaymentId ?? "-")}</div>
      </div>
      <div class="meta-cell">
        <div class="meta-key">Checkout Session</div>
        <div class="meta-val">${escapeHtml(receipt.revenueEvent.checkoutSessionId ?? "-")}</div>
      </div>
      <div class="meta-cell">
        <div class="meta-key">Allocation Rule</div>
        <div class="meta-val meta-val-highlight">${escapeHtml(receipt.allocationRule.name)}</div>
      </div>
      <div class="meta-cell">
        <div class="meta-key">Refund Status</div>
        <div class="meta-val">${escapeHtml(
          receipt.revenueEvent.dodoRefundStatus ?? "none"
        )} &nbsp;&middot;&nbsp; Refund ID: ${escapeHtml(
          receipt.revenueEvent.dodoRefundId ?? "-"
        )}</div>
        <div class="meta-links">
          ${
            paymentReceiptHref
              ? `<a href="${paymentReceiptHref}" class="meta-link" target="_blank" rel="noreferrer" download>Payment receipt</a>`
              : ""
          }
          ${
            refundReceiptHref
              ? `<a href="${refundReceiptHref}" class="meta-link" target="_blank" rel="noreferrer" download>Refund receipt</a>`
              : ""
          }
        </div>
      </div>
    </div>
    <div class="alloc-bar-section">
      <div class="alloc-bar-label">Allocation distribution</div>
      <div class="alloc-bar-track">${allocationSegments}</div>
      <div class="alloc-legend">${allocationLegend}</div>
    </div>
    <div style="border-top:1px solid var(--border);">
      <div class="section-header">
        <div>
          <div class="section-eyebrow">payout intents</div>
          <div class="section-title">On-chain Settlement Routes</div>
        </div>
        <span class="section-count">${receipt.payoutIntents.length} intents</span>
      </div>
      <div class="intent-list">${intentRows}</div>
    </div>
    <div class="settlement-row">
      <div class="settlement-left">
        <div class="settlement-label">Allocation Rule</div>
        <div class="settlement-rule">${escapeHtml(
          receipt.allocationRule.name
        )} &nbsp;&middot;&nbsp; 10,000 bps OK</div>
      </div>
      <div class="settlement-total-block">
        <div class="settlement-total-label">Settlement Total</div>
        <div class="settlement-total">${escapeHtml(formatMoney(total, "USDC"))}</div>
      </div>
    </div>
    <div class="receipt-footer">
      <div class="footer-left">
        AllocRail Audit Receipt &nbsp;&middot;&nbsp; Generated ${escapeHtml(
          receipt.revenueEvent.receivedAt
        )}<br />
        Powered by Dodo Payments &middot; Settled on Solana devnet
      </div>
      <div class="footer-right">
        <div class="footer-chain"><span class="footer-chain-dot"></span>Solana Devnet &middot; USDC</div>
        <div class="footer-dodo">Dodo test_mode &middot; Superteam India x Solana Frontier</div>
      </div>
    </div>
  </div>
</div>
</body>
</html>`;
}

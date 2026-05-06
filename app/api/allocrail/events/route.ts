import { NextRequest, NextResponse } from "next/server";
import {
  listRecentPayoutIntents,
  listRecentReceipts,
  listRecentRevenueEvents,
} from "@/app/lib/allocrail/event-store";

function escapeCsv(value: string | number | null | undefined) {
  const stringValue = value == null ? "" : String(value);
  const escaped = stringValue.replace(/"/g, '""');
  return `"${escaped}"`;
}

function buildEventsCsv() {
  const events = listRecentRevenueEvents();
  const header = [
    "event_id",
    "event_type",
    "payment_id",
    "checkout_session_id",
    "amount_cents",
    "currency",
    "rule_id",
    "workspace_id",
    "merchant_id",
    "product_tag",
    "received_at",
  ];

  const rows = events.map((event) =>
    [
      event.id,
      event.type,
      event.dodoPaymentId ?? "",
      event.checkoutSessionId ?? "",
      event.amountCents,
      event.currency,
      event.metadata.rule_id,
      event.metadata.workspace_id,
      event.metadata.merchant_id,
      event.metadata.product_tag,
      event.receivedAt,
    ]
      .map(escapeCsv)
      .join(",")
  );

  return [header.join(","), ...rows].join("\n");
}

export function GET(req: NextRequest) {
  const format = req.nextUrl.searchParams.get("format");
  const events = listRecentRevenueEvents();
  const payoutIntents = listRecentPayoutIntents();
  const receipts = listRecentReceipts();

  if (format === "csv") {
    const csv = buildEventsCsv();
    const timestamp = new Date().toISOString().slice(0, 10);

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="allocrail-events-${timestamp}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  }

  return NextResponse.json({
    count: events.length,
    events,
    payoutIntentCount: payoutIntents.length,
    receiptCount: receipts.length,
  });
}

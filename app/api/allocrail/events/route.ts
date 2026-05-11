import { NextRequest, NextResponse } from "next/server";
import {
  getEventRouteKind,
  getEventRouteKindLabel,
} from "@/app/lib/allocrail/dashboard-data";
import {
  listRecentPayoutIntents,
  listRecentReceipts,
  listRecentRevenueEvents,
} from "@/app/lib/allocrail/event-store";
import {
  listCurrentFounderOwnedWorkspaceIds,
  requireCurrentFounder,
} from "@/app/lib/allocrail/founder";
import type { RevenueEvent } from "@/app/lib/allocrail/types";

function escapeCsv(value: string | number | null | undefined) {
  const stringValue = value == null ? "" : String(value);
  const escaped = stringValue.replace(/"/g, '""');
  return `"${escaped}"`;
}

async function buildEventsCsv() {
  const workspaceIds = await listCurrentFounderOwnedWorkspaceIds();
  const events = await listRecentRevenueEvents({ workspaceIds });
  const header = [
    "Event ID",
    "Event Type",
    "Route Kind",
    "Amount",
    "Currency",
    "Payment ID",
    "Subscription ID",
    "Checkout Session ID",
    "Customer ID",
    "Rule ID",
    "Workspace ID",
    "Merchant ID",
    "Product Tag",
    "Received At",
  ];

  const rows = events.map((event: RevenueEvent) =>
    [
      event.id,
      event.type,
      getEventRouteKindLabel(getEventRouteKind(event)),
      (event.amountCents / 100).toFixed(2),
      event.currency,
      event.dodoPaymentId ?? "",
      event.dodoSubscriptionId ?? "",
      event.checkoutSessionId ?? "",
      event.dodoCustomerId ?? "",
      event.metadata.rule_id ?? "",
      event.metadata.workspace_id ?? "",
      event.metadata.merchant_id ?? "",
      event.metadata.product_tag ?? "",
      event.receivedAt,
    ]
      .map(escapeCsv)
      .join(",")
  );

  return [`\uFEFF${header.join(",")}`, ...rows].join("\n");
}

export async function GET(req: NextRequest) {
  await requireCurrentFounder();
  const workspaceIds = await listCurrentFounderOwnedWorkspaceIds();
  const format = req.nextUrl.searchParams.get("format");
  const [events, payoutIntents, receipts] = await Promise.all([
    listRecentRevenueEvents({ workspaceIds }),
    listRecentPayoutIntents({ workspaceIds }),
    listRecentReceipts({ workspaceIds }),
  ]);

  if (format === "csv") {
    const csv = await buildEventsCsv();
    const timestamp = new Date().toISOString().slice(0, 10);

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="allocrail-revenue-events-${timestamp}.csv"`,
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

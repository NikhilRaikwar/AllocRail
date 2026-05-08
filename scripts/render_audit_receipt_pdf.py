import io
import json
import sys
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas


def money(cents, currency):
    return f"{cents / 100:,.2f} {currency}"


def safe(value):
    return "-" if value is None else str(value)


def draw_wrapped(c, text, x, y, max_width, font_name="Helvetica", font_size=10, leading=14):
    c.setFont(font_name, font_size)
    words = str(text).split()
    line = []
    current_y = y
    for word in words:
        test = " ".join(line + [word])
        if c.stringWidth(test, font_name, font_size) <= max_width:
            line.append(word)
        else:
            c.drawString(x, current_y, " ".join(line))
            current_y -= leading
            line = [word]
    if line:
        c.drawString(x, current_y, " ".join(line))
        current_y -= leading
    return current_y


def main():
    payload = json.load(sys.stdin)
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4

    left = 18 * mm
    right = width - 18 * mm
    y = height - 20 * mm

    c.setTitle(f"AllocRail Audit Receipt {payload['receipt_id']}")

    c.setFont("Helvetica-Bold", 18)
    c.drawString(left, y, "AllocRail Audit Receipt")
    y -= 10 * mm

    c.setFont("Helvetica", 10)
    header_rows = [
        ("Receipt ID", payload["receipt_id"]),
        ("Dodo Payment ID", payload.get("payment_id")),
        ("Checkout Session", payload.get("checkout_session_id")),
        ("Source Revenue", money(payload["source_amount_cents"], payload["source_currency"])),
        ("Allocation Rule", payload["allocation_rule_name"]),
        ("Receipt Time", payload["received_at"]),
        ("Refund Status", payload.get("refund_status") or "none"),
        ("Refund ID", payload.get("refund_id")),
    ]

    for label, value in header_rows:
      c.setFont("Helvetica-Bold", 10)
      c.drawString(left, y, f"{label}:")
      c.setFont("Helvetica", 10)
      c.drawString(left + 38 * mm, y, safe(value))
      y -= 6 * mm

    y -= 4 * mm
    c.setStrokeColor(colors.HexColor("#d6cec1"))
    c.line(left, y, right, y)
    y -= 8 * mm

    c.setFont("Helvetica-Bold", 12)
    c.drawString(left, y, "Payout Intents")
    y -= 8 * mm

    columns = [
        ("Bucket", left, 42 * mm),
        ("Wallet", left + 45 * mm, 58 * mm),
        ("Amount", left + 107 * mm, 22 * mm),
        ("Status", left + 132 * mm, 24 * mm),
    ]

    c.setFillColor(colors.HexColor("#f5f0e8"))
    c.rect(left, y - 5 * mm, right - left, 8 * mm, fill=1, stroke=0)
    c.setFillColor(colors.black)
    c.setFont("Helvetica-Bold", 9)
    for label, x, _ in columns:
        c.drawString(x, y - 2 * mm, label)
    y -= 9 * mm

    c.setFont("Helvetica", 9)
    for intent in payload["intents"]:
        row_height = 10 * mm
        if y < 28 * mm:
            c.showPage()
            y = height - 20 * mm

        c.setStrokeColor(colors.HexColor("#e3dac8"))
        c.line(left, y, right, y)
        y -= 6 * mm

        c.drawString(columns[0][1], y, safe(intent["bucket"]))
        c.drawString(columns[1][1], y, safe(intent["wallet"]))
        c.drawString(columns[2][1], y, money(intent["amount_cents"], intent["currency"]))
        c.drawString(columns[3][1], y, safe(intent["status"]))
        y -= row_height - 6 * mm

        if intent.get("signature"):
            y = draw_wrapped(
                c,
                f"Signature: {intent['signature']}",
                columns[1][1],
                y + 2 * mm,
                right - columns[1][1],
                font_size=8,
                leading=10,
            )
        elif intent.get("failure_reason"):
            y = draw_wrapped(
                c,
                f"Note: {intent['failure_reason']}",
                columns[1][1],
                y + 2 * mm,
                right - columns[1][1],
                font_size=8,
                leading=10,
            )
        else:
            y -= 4 * mm

    c.setStrokeColor(colors.HexColor("#d6cec1"))
    c.line(left, y, right, y)
    y -= 8 * mm
    c.setFont("Helvetica-Bold", 10)
    c.drawString(left, y, "Settlement Total:")
    c.setFont("Helvetica", 10)
    c.drawString(left + 38 * mm, y, money(payload["settlement_total_cents"], "USDC"))

    c.save()
    sys.stdout.buffer.write(buffer.getvalue())


if __name__ == "__main__":
    main()

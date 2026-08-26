import { PDFDocument, StandardFonts, rgb, type PDFImage } from "pdf-lib";

async function embedLogo(doc: PDFDocument, bytes: Uint8Array): Promise<PDFImage | null> {
  try {
    return await doc.embedPng(bytes);
  } catch {
    // Fall through to JPEG.
  }
  try {
    return await doc.embedJpg(bytes);
  } catch {
    return null;
  }
}

export async function generateReceiptPdf({
  receiptNumber,
  issuedAt,
  buyerName,
  buyerEmail,
  itemLabel,
  itemTitle,
  amount,
  discountAmount,
  creditApplied,
  netAmount,
  currency,
  chargedAmount,
  paymentId,
  orgLogoBytes,
}: {
  receiptNumber: string;
  issuedAt: Date;
  buyerName: string;
  buyerEmail: string;
  itemLabel: string;
  itemTitle: string;
  amount: number;
  discountAmount: number;
  creditApplied: number;
  netAmount: number;
  currency: string;
  chargedAmount: number | null;
  paymentId: string | null;
  orgLogoBytes?: Uint8Array | null;
}): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]); // A4 portrait
  const { width, height } = page.getSize();

  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const margin = 56;

  let cursorY = height - 60;

  if (orgLogoBytes) {
    const logo = await embedLogo(doc, orgLogoBytes);
    if (logo) {
      const logoSize = 40;
      const scale = Math.min(logoSize / logo.width, logoSize / logo.height);
      page.drawImage(logo, {
        x: margin,
        y: cursorY - logoSize,
        width: logo.width * scale,
        height: logo.height * scale,
      });
    }
  }

  page.drawText("ScholarAura", { x: margin + 52, y: cursorY - 18, size: 18, font: fontBold });
  page.drawText("Payment receipt", {
    x: margin + 52,
    y: cursorY - 36,
    size: 11,
    font,
    color: rgb(0.4, 0.4, 0.4),
  });

  const rightAlign = (text: string, y: number, size: number, useFont = font) => {
    const textWidth = useFont.widthOfTextAtSize(text, size);
    page.drawText(text, { x: width - margin - textWidth, y, size, font: useFont });
  };
  rightAlign(`Receipt #${receiptNumber}`, cursorY - 10, 11, fontBold);
  rightAlign(
    issuedAt.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }),
    cursorY - 26,
    10
  );

  cursorY -= 80;
  page.drawLine({
    start: { x: margin, y: cursorY },
    end: { x: width - margin, y: cursorY },
    thickness: 1,
    color: rgb(0.85, 0.85, 0.85),
  });

  cursorY -= 30;
  page.drawText("Billed to", { x: margin, y: cursorY, size: 10, font, color: rgb(0.5, 0.5, 0.5) });
  cursorY -= 18;
  page.drawText(buyerName, { x: margin, y: cursorY, size: 13, font: fontBold });
  cursorY -= 16;
  page.drawText(buyerEmail, { x: margin, y: cursorY, size: 11, font, color: rgb(0.35, 0.35, 0.35) });

  cursorY -= 50;
  page.drawText("Description", { x: margin, y: cursorY, size: 10, font, color: rgb(0.5, 0.5, 0.5) });
  rightAlign("Amount", cursorY, 10, font);

  cursorY -= 8;
  page.drawLine({
    start: { x: margin, y: cursorY },
    end: { x: width - margin, y: cursorY },
    thickness: 1,
    color: rgb(0.85, 0.85, 0.85),
  });

  cursorY -= 26;
  page.drawText(itemLabel, { x: margin, y: cursorY, size: 9, font, color: rgb(0.5, 0.5, 0.5) });
  cursorY -= 15;
  page.drawText(itemTitle, { x: margin, y: cursorY, size: 12, font: fontBold });
  rightAlign(`Rs. ${amount.toLocaleString("en-IN")}`, cursorY, 12, font);

  if (discountAmount > 0) {
    cursorY -= 22;
    page.drawText("Coupon discount", { x: margin, y: cursorY, size: 11, font, color: rgb(0.4, 0.4, 0.4) });
    rightAlign(`- Rs. ${discountAmount.toLocaleString("en-IN")}`, cursorY, 11, font);
  }
  if (creditApplied > 0) {
    cursorY -= 22;
    page.drawText("Referral credit applied", { x: margin, y: cursorY, size: 11, font, color: rgb(0.4, 0.4, 0.4) });
    rightAlign(`- Rs. ${creditApplied.toLocaleString("en-IN")}`, cursorY, 11, font);
  }

  cursorY -= 20;
  page.drawLine({
    start: { x: margin, y: cursorY },
    end: { x: width - margin, y: cursorY },
    thickness: 1,
    color: rgb(0.85, 0.85, 0.85),
  });

  cursorY -= 28;
  page.drawText("Total paid", { x: margin, y: cursorY, size: 13, font: fontBold });
  rightAlign(`Rs. ${netAmount.toLocaleString("en-IN")}`, cursorY, 14, fontBold);

  if (currency !== "INR" && chargedAmount != null) {
    cursorY -= 18;
    rightAlign(`Charged as ${currency} ${chargedAmount.toLocaleString("en-IN")}`, cursorY, 9, font);
  }

  cursorY -= 40;
  page.drawText(
    paymentId ? `Payment ID: ${paymentId}` : "Paid using account credit",
    { x: margin, y: cursorY, size: 9, font, color: rgb(0.5, 0.5, 0.5) }
  );
  cursorY -= 14;
  page.drawText("Status: PAID", { x: margin, y: cursorY, size: 9, font, color: rgb(0.15, 0.5, 0.25) });

  page.drawText("Thank you for learning with ScholarAura.", {
    x: margin,
    y: 50,
    size: 9,
    font,
    color: rgb(0.5, 0.5, 0.5),
  });

  return doc.save();
}

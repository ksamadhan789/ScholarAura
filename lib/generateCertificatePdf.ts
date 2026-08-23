import { PDFDocument, StandardFonts, rgb, type PDFImage } from "pdf-lib";
import QRCode from "qrcode";

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

export async function generateCertificatePdf({
  recipientName,
  title,
  subtitle,
  certificateNumber,
  issuedAt,
  verifyUrl,
  orgLogoBytes,
  partnerLogoBytes,
}: {
  recipientName: string;
  title: string;
  subtitle: string;
  certificateNumber: string;
  issuedAt: Date;
  verifyUrl: string;
  orgLogoBytes?: Uint8Array | null;
  partnerLogoBytes?: Uint8Array | null;
}): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([842, 595]);
  const { width, height } = page.getSize();

  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const font = await doc.embedFont(StandardFonts.Helvetica);

  const centerText = (
    text: string,
    y: number,
    size: number,
    useFont = font,
    color = rgb(0.1, 0.1, 0.1)
  ) => {
    const textWidth = useFont.widthOfTextAtSize(text, size);
    page.drawText(text, { x: (width - textWidth) / 2, y, size, font: useFont, color });
  };

  page.drawRectangle({
    x: 24,
    y: 24,
    width: width - 48,
    height: height - 48,
    borderColor: rgb(0.15, 0.15, 0.15),
    borderWidth: 2,
  });
  page.drawRectangle({
    x: 34,
    y: 34,
    width: width - 68,
    height: height - 68,
    borderColor: rgb(0.7, 0.7, 0.7),
    borderWidth: 1,
  });

  const logoBoxSize = 56;
  const logoY = height - 70;

  const drawLogo = (image: PDFImage, x: number) => {
    const scale = Math.min(logoBoxSize / image.width, logoBoxSize / image.height);
    const w = image.width * scale;
    const h = image.height * scale;
    page.drawImage(image, {
      x: x + (logoBoxSize - w) / 2,
      y: logoY - h,
      width: w,
      height: h,
    });
  };

  if (orgLogoBytes) {
    const orgLogo = await embedLogo(doc, orgLogoBytes);
    if (orgLogo) drawLogo(orgLogo, 60);
  }
  if (partnerLogoBytes) {
    const partnerLogo = await embedLogo(doc, partnerLogoBytes);
    if (partnerLogo) drawLogo(partnerLogo, width - 60 - logoBoxSize);
  }

  centerText("Certificate of Completion", height - 130, 30, fontBold);
  centerText("This is to certify that", height - 190, 14, font, rgb(0.35, 0.35, 0.35));
  centerText(recipientName, height - 230, 26, fontBold);
  centerText(subtitle, height - 270, 14, font, rgb(0.35, 0.35, 0.35));
  centerText(title, height - 300, 20, fontBold);
  centerText(
    `Issued on ${issuedAt.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}`,
    height - 340,
    12,
    font,
    rgb(0.4, 0.4, 0.4)
  );

  page.drawText(`Certificate No: ${certificateNumber}`, {
    x: 60,
    y: 55,
    size: 10,
    font,
    color: rgb(0.4, 0.4, 0.4),
  });

  const qrDataUrl = await QRCode.toDataURL(verifyUrl, { margin: 1, width: 200 });
  const qrImageBytes = Buffer.from(qrDataUrl.split(",")[1], "base64");
  const qrImage = await doc.embedPng(qrImageBytes);
  const qrSize = 90;
  page.drawImage(qrImage, {
    x: width - 60 - qrSize,
    y: 45,
    width: qrSize,
    height: qrSize,
  });
  const qrLabel = "Scan to verify";
  const qrLabelWidth = font.widthOfTextAtSize(qrLabel, 9);
  page.drawText(qrLabel, {
    x: width - 60 - qrSize / 2 - qrLabelWidth / 2,
    y: 35,
    size: 9,
    font,
    color: rgb(0.4, 0.4, 0.4),
  });

  return doc.save();
}

/**
 * Stamps a verification QR code + certificate number onto the first page of
 * an already-rendered PDF (used for certificates exported from a Google
 * Slides template, which we don't generate from scratch). Positioned
 * relative to the page's own size since Slides templates vary in dimensions.
 */
export async function stampVerificationOnPdf(
  pdfBytes: Uint8Array,
  certificateNumber: string,
  verifyUrl: string
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(pdfBytes);
  const page = doc.getPage(0);
  const { width } = page.getSize();
  const font = await doc.embedFont(StandardFonts.Helvetica);

  const margin = 28;
  const qrSize = 64;

  const qrDataUrl = await QRCode.toDataURL(verifyUrl, { margin: 1, width: 200 });
  const qrImageBytes = Buffer.from(qrDataUrl.split(",")[1], "base64");
  const qrImage = await doc.embedPng(qrImageBytes);
  page.drawImage(qrImage, { x: width - margin - qrSize, y: margin, width: qrSize, height: qrSize });

  page.drawText(`Certificate No: ${certificateNumber}`, {
    x: margin,
    y: margin,
    size: 9,
    font,
    color: rgb(0.4, 0.4, 0.4),
  });

  return doc.save();
}

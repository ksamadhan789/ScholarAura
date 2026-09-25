import { prisma } from "@/lib/prisma";

/**
 * Checkout charges amount × 100 (two decimal places). These currencies use
 * three or zero decimals, so they'd be charged 10× too little or 100× too
 * much — refused everywhere until checkout handles per-currency decimals.
 */
export const UNSUPPORTED_DECIMAL_CURRENCIES = new Set([
  // three decimal places
  "BHD", "IQD", "JOD", "KWD", "LYD", "OMR", "TND",
  // zero decimal places
  "BIF", "CLP", "DJF", "GNF", "ISK", "JPY", "KMF", "KRW", "PYG", "RWF", "UGX", "VND", "VUV", "XAF", "XOF", "XPF",
]);

export async function getExchangeRate(currencyCode: string) {
  if (currencyCode === "INR") return { currencyCode: "INR", symbol: "₹", rateFromInr: 1 };
  if (UNSUPPORTED_DECIMAL_CURRENCIES.has(currencyCode)) return null;
  return prisma.exchangeRate.findUnique({ where: { currencyCode } });
}

export function convertFromInr(priceInInr: number, rateFromInr: number): number {
  return Math.round(priceInInr * rateFromInr * 100) / 100;
}

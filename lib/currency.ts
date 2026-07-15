import { prisma } from "@/lib/prisma";

export async function getExchangeRate(currencyCode: string) {
  if (currencyCode === "INR") return { currencyCode: "INR", symbol: "₹", rateFromInr: 1 };
  return prisma.exchangeRate.findUnique({ where: { currencyCode } });
}

export function convertFromInr(priceInInr: number, rateFromInr: number): number {
  return Math.round(priceInInr * rateFromInr * 100) / 100;
}

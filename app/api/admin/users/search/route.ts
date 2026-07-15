import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const email = new URL(request.url).searchParams.get("email");
  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isAffiliate: true,
      affiliateRatePercent: true,
      creditBalance: true,
      referralCode: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "No user with that email" }, { status: 404 });
  }

  return NextResponse.json(user);
}

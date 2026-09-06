import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasCompletedOnboarding } from "@/lib/onboarding";
import { enrollFreeBundle } from "@/lib/bundlePurchase";

export async function POST(_request: Request, { params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "You must be logged in" }, { status: 401 });
  }
  if (!(await hasCompletedOnboarding(session.user.id, session.user.role))) {
    return NextResponse.json(
      { error: "Please complete your profile before enrolling.", code: "ONBOARDING_REQUIRED" },
      { status: 403 }
    );
  }

  const bundle = await prisma.courseBundle.findUnique({
    where: { slug: params.slug },
    include: { items: { select: { courseId: true } } },
  });
  if (!bundle || !bundle.isPublished) {
    return NextResponse.json({ error: "Bundle not found" }, { status: 404 });
  }
  if (Number(bundle.price) > 0) {
    return NextResponse.json(
      { error: "This bundle requires payment — use checkout instead" },
      { status: 400 }
    );
  }

  const existing = await prisma.bundlePurchase.findUnique({
    where: { userId_bundleId: { userId: session.user.id, bundleId: bundle.id } },
  });
  if (existing?.status === "SUCCESS") {
    return NextResponse.json({ error: "You already own this bundle" }, { status: 409 });
  }

  const purchase = await enrollFreeBundle(
    session.user.id,
    bundle.id,
    bundle.items.map((item) => item.courseId)
  );

  return NextResponse.json(purchase, { status: 201 });
}

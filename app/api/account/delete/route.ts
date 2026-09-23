import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deactivateAccount, AccountNotFoundError } from "@/lib/accountDeletion";
import { sendAccountDeletionEmail } from "@/lib/email";
import { createNotification } from "@/lib/notify";

const MAX_REASON_LENGTH = 1000;

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not allowed" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const reasonRaw = typeof body?.reason === "string" ? body.reason.trim() : "";
  const reason = reasonRaw ? reasonRaw.slice(0, MAX_REASON_LENGTH) : null;

  let deleted: { name: string; email: string };
  try {
    deleted = await deactivateAccount(session.user.id, reason);
  } catch (err) {
    if (err instanceof AccountNotFoundError) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }
    console.error("Account deletion failed:", err);
    return NextResponse.json({ error: "Couldn't delete your account. Please try again." }, { status: 500 });
  }

  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true, name: true, email: true },
  });

  await Promise.all(
    admins.map((admin) =>
      Promise.all([
        sendAccountDeletionEmail(admin.email, admin.name, {
          name: deleted.name,
          email: deleted.email,
          reason,
        }).catch((err) => console.error("Failed to send account deletion email:", err)),
        createNotification({
          userId: admin.id,
          type: "ACCOUNT_DELETED",
          title: `${deleted.name} deleted their account`,
          body: reason ?? undefined,
        }).catch((err) => console.error("Failed to create account deletion notification:", err)),
      ])
    )
  );

  return NextResponse.json({ ok: true });
}

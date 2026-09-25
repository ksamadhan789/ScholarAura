import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { canonicalMailbox, generateReferralCode } from "@/lib/referral";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { checkRateLimit, REGISTER_ATTEMPT_LIMIT, REGISTER_WINDOW_MS } from "@/lib/rateLimit";
import { isEmailVerificationRequired, sendVerificationEmail } from "@/lib/emailVerification";
import { handleSignupForExistingAccount, signupResponseBody } from "@/lib/signupExistingAccount";

const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  ref: z.string().optional(),
  turnstileToken: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const remoteIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const withinRegisterLimit = await checkRateLimit(
      `register:${remoteIp ?? "unknown"}`,
      REGISTER_ATTEMPT_LIMIT,
      REGISTER_WINDOW_MS
    );
    if (!withinRegisterLimit) {
      return NextResponse.json(
        { error: "Too many signup attempts. Please wait a while and try again." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { name, email, password, ref, turnstileToken } = parsed.data;

    if (process.env.TURNSTILE_SECRET_KEY) {
      if (!turnstileToken) {
        return NextResponse.json(
          { error: "Please complete the verification challenge" },
          { status: 400 }
        );
      }
      const verified = await verifyTurnstileToken(turnstileToken, remoteIp);
      if (!verified) {
        return NextResponse.json(
          { error: "Verification failed. Please try again." },
          { status: 400 }
        );
      }
    }

    // Same response whether or not the email is taken — see
    // lib/signupExistingAccount.ts. The real owner gets an email instead.
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(await handleSignupForExistingAccount(existing, password, email), { status: 201 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const referralCode = await generateReferralCode();

    let referredById: string | undefined;
    if (ref) {
      const referrer = await prisma.user.findUnique({ where: { referralCode: ref } });
      // Referring your own second inbox would pay you a reward on your own purchases.
      if (referrer && canonicalMailbox(referrer.email) !== canonicalMailbox(email)) {
        referredById = referrer.id;
      }
    }

    const user = await prisma.user.create({
      data: { name, email, passwordHash, referralCode, referredById },
    });

    // Sent even when enforcement is switched off, so the address still gets
    // confirmed; the page only waits for it when sign-in requires it.
    await sendVerificationEmail(user).catch((err) =>
      console.error("Failed to send verification email after registration:", err)
    );

    return NextResponse.json(
      signupResponseBody(user.email, isEmailVerificationRequired()),
      { status: 201 }
    );
  } catch (err) {
    console.error("Registration failed:", err);
    return NextResponse.json(
      { error: "The server is waking up — please try again in a few seconds." },
      { status: 503 }
    );
  }
}

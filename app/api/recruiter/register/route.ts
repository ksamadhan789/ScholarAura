import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyTurnstileToken } from "@/lib/turnstile";

const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  companyName: z.string().min(1, "Company name is required"),
  companyWebsite: z.union([z.string().trim().url("Enter a valid URL"), z.literal("")]).optional(),
  designation: z.string().trim().optional().or(z.literal("")),
  turnstileToken: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    const { name, email, password, companyName, companyWebsite, designation, turnstileToken } =
      parsed.data;

    if (process.env.TURNSTILE_SECRET_KEY) {
      if (!turnstileToken) {
        return NextResponse.json(
          { error: "Please complete the verification challenge" },
          { status: 400 }
        );
      }
      const remoteIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
      const verified = await verifyTurnstileToken(turnstileToken, remoteIp);
      if (!verified) {
        return NextResponse.json(
          { error: "Verification failed. Please try again." },
          { status: 400 }
        );
      }
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: "RECRUITER",
        recruiterProfile: {
          create: {
            companyName,
            companyWebsite: companyWebsite || null,
            designation: designation || null,
          },
        },
      },
    });

    return NextResponse.json({ id: user.id, email: user.email }, { status: 201 });
  } catch (err) {
    console.error("Recruiter registration failed:", err);
    return NextResponse.json(
      { error: "The server is waking up — please try again in a few seconds." },
      { status: 503 }
    );
  }
}

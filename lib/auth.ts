import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "@/lib/prisma";
import { findOrCreateGoogleUser } from "@/lib/googleAccount";
import { checkRateLimit } from "@/lib/rateLimit";
import { EMAIL_NOT_VERIFIED, mustVerifyBeforeLogin, sendVerificationEmail } from "@/lib/emailVerification";

const LOGIN_ATTEMPT_LIMIT = 5;
const LOGIN_WINDOW_MS = 5 * 60 * 1000;
// Looser cap per account across all IPs, against a distributed brute force.
const LOGIN_ACCOUNT_ATTEMPT_LIMIT = 30;
const LOGIN_ACCOUNT_WINDOW_MS = 15 * 60 * 1000;
// Compared against when the email has no password, so a login attempt takes
// the same time whether or not the account exists.
const DUMMY_PASSWORD_HASH = "$2a$10$1UZhn96PNDrJ8..BkGdeyu4Bb/c0.cUGMvxOSyMe0Y.XMBngk6Cne";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
    CredentialsProvider({
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) return null;

        // Keyed by email + IP, so someone else hammering a victim's email
        // from their own connection can't lock the victim out; plus a looser
        // per-email cap across all IPs so a distributed guesser is still
        // throttled. Returning null either way (rate-limited or wrong
        // password) keeps the response indistinguishable from a bad login.
        const email = credentials.email.trim().toLowerCase();
        const forwardedFor = req?.headers?.["x-forwarded-for"];
        const ip = (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor)?.split(",")[0]?.trim() ?? "unknown";
        const allowed =
          (await checkRateLimit(`login:${email}:${ip}`, LOGIN_ATTEMPT_LIMIT, LOGIN_WINDOW_MS)) &&
          (await checkRateLimit(`login-account:${email}`, LOGIN_ACCOUNT_ATTEMPT_LIMIT, LOGIN_ACCOUNT_WINDOW_MS));
        if (!allowed) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });
        if (!user || !user.passwordHash) {
          await bcrypt.compare(credentials.password, DUMMY_PASSWORD_HASH);
          return null;
        }

        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;

        // Correct password but unverified email: send a fresh link (rate-
        // limited) and tell the login page why, instead of a generic failure,
        // so someone who never verified isn't simply stuck. Only reached
        // after the password check, so it reveals nothing to a guesser.
        if (mustVerifyBeforeLogin(user)) {
          await sendVerificationEmail(user).catch((err) =>
            console.error("Failed to send verification email on login:", err)
          );
          throw new Error(EMAIL_NOT_VERIFIED);
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
    CredentialsProvider({
      id: "google-one-tap",
      name: "Google One Tap",
      credentials: {
        credential: { label: "Credential", type: "text" },
      },
      async authorize(credentials) {
        const clientId = process.env.GOOGLE_CLIENT_ID;
        if (!credentials?.credential || !clientId) return null;

        // Verifies the ID token's signature, expiry, issuer, and audience
        // against Google's public keys — never trust a client-sent
        // credential without this.
        const client = new OAuth2Client(clientId);
        let payload;
        try {
          const ticket = await client.verifyIdToken({
            idToken: credentials.credential,
            audience: clientId,
          });
          payload = ticket.getPayload();
        } catch {
          return null;
        }

        if (!payload?.email || !payload.email_verified || !payload.sub) return null;

        const user = await findOrCreateGoogleUser({
          email: payload.email,
          name: payload.name ?? payload.email,
          googleId: payload.sub,
        });

        return { id: user.id, name: user.name, email: user.email, role: user.role };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google" && user.email) {
        // Google's raw OAuth profile (unlike the mapped one on `user`) carries
        // email_verified — without checking it, someone who controls a
        // Google account with an unverified alias matching an existing
        // ScholarAura user's email could link that Google identity to the
        // victim's account and sign in as them from then on. The One Tap
        // sign-in path already enforces this same check.
        const emailVerified = (profile as { email_verified?: boolean } | undefined)?.email_verified;
        if (!emailVerified) return false;

        await findOrCreateGoogleUser({
          email: user.email,
          name: user.name ?? user.email,
          googleId: account.providerAccountId,
        });
      }
      return true;
    },
    async jwt({ token, user }) {
      // Re-read the user on every call so a role change (e.g. an admin
      // demoted after abuse) takes effect on their next request instead of
      // staying cached in the JWT for the session's 30-day lifetime. At
      // sign-in the token's sub can be the provider's id (Google), so look
      // up by email there; afterwards always by our own id, because account
      // deletion rewrites the email — an email lookup that found nothing
      // used to leave a deleted account's token working.
      const signInEmail = user ? (user.email ?? token.email) : null;
      const dbUser = signInEmail
        ? await prisma.user.findUnique({ where: { email: signInEmail } })
        : token.sub
          ? await prisma.user.findUnique({ where: { id: token.sub } })
          : null;

      if (user && dbUser) {
        token.sessionVersion = dbUser.sessionVersion;
      }

      // Deleted account, or signed out everywhere since this token was
      // issued (password reset, Google linking that removed a squatter's
      // password) — throwing makes NextAuth clear the cookie and treat the
      // request as signed out.
      if (!dbUser || dbUser.deactivatedAt || (token.sessionVersion ?? 0) !== dbUser.sessionVersion) {
        throw new Error("SESSION_REVOKED");
      }

      token.sub = dbUser.id;
      token.role = dbUser.role;
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
};

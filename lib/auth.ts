import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "@/lib/prisma";
import { findOrCreateGoogleUser } from "@/lib/googleAccount";
import { checkRateLimit } from "@/lib/rateLimit";

const LOGIN_ATTEMPT_LIMIT = 5;
const LOGIN_WINDOW_MS = 5 * 60 * 1000;

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
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // Keyed by the submitted email (not IP, which isn't reliably
        // available in this callback) — protects a single account from
        // being brute-forced regardless of where the attempts come from.
        // Returning null either way (rate-limited or wrong password) keeps
        // the response indistinguishable, same as any other failed login.
        const allowed = await checkRateLimit(
          `login:${credentials.email.trim().toLowerCase()}`,
          LOGIN_ATTEMPT_LIMIT,
          LOGIN_WINDOW_MS
        );
        if (!allowed) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });
        if (!user || !user.passwordHash) return null;

        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;

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
      if (user) {
        token.role = (user as { role?: string }).role;
      }
      // Re-read on every call (not just when token.role is unset) so a role
      // change (e.g. an admin demoted after abuse) takes effect on the
      // user's next request instead of staying cached in the JWT for up to
      // the session's 30-day lifetime.
      if (token.email) {
        const dbUser = await prisma.user.findUnique({ where: { email: token.email } });
        if (dbUser) {
          token.role = dbUser.role;
          token.sub = dbUser.id;
        }
      }
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

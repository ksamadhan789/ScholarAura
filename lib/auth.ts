import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "@/lib/prisma";
import { findOrCreateGoogleUser } from "@/lib/googleAccount";

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
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
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

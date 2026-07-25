import { PrismaClient, Prisma } from "@prisma/client";
import dns from "dns";

// Some sandboxed/dev network environments have broken IPv6 egress, which makes
// Node's default DNS resolution order intermittently pick an unreachable IPv6
// address for the database host. Forcing IPv4 avoids that.
dns.setDefaultResultOrder("ipv4first");

// Neon's free tier suspends its compute when idle, so the first query after a
// pause can fail with "can't reach database server" while it wakes back up.
// Retrying only covers errors that happen before a query reaches the server
// (connection/handshake failures), so it's safe for both reads and writes —
// it never retries a query that may have already executed.
const RECONNECT_ERROR_CODES = new Set(["P1001", "P1002"]);
const RETRY_DELAYS_MS = [300, 700, 1500];

function isReconnectError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientInitializationError) return true;
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return RECONNECT_ERROR_CODES.has(error.code);
  }
  return false;
}

// Cast back to plain PrismaClient: $extends returns a structurally different
// type that isn't assignable to Prisma.TransactionClient at call sites (e.g.
// helpers that accept either `prisma` or a `$transaction` callback client).
// The retry wrapper only changes runtime query behavior, not the client's
// public shape, so this cast is safe.
function withColdStartRetry(client: PrismaClient): PrismaClient {
  return client.$extends({
    name: "neon-cold-start-retry",
    query: {
      async $allOperations({ args, query }) {
        for (let attempt = 0; ; attempt++) {
          try {
            return await query(args);
          } catch (error) {
            if (attempt >= RETRY_DELAYS_MS.length || !isReconnectError(error)) throw error;
            await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS_MS[attempt]));
          }
        }
      },
    },
  }) as unknown as PrismaClient;
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? withColdStartRetry(new PrismaClient());

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

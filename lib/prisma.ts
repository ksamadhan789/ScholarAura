import { PrismaClient } from "@prisma/client";
import dns from "dns";

// Some sandboxed/dev network environments have broken IPv6 egress, which makes
// Node's default DNS resolution order intermittently pick an unreachable IPv6
// address for the database host. Forcing IPv4 avoids that.
dns.setDefaultResultOrder("ipv4first");

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

import type { PrismaClient } from "@prisma/client";
import { beforeEach, vi } from "vitest";
import { mockDeep, mockReset, type DeepMockProxy } from "vitest-mock-extended";

export const prismaMock: DeepMockProxy<PrismaClient> = mockDeep<PrismaClient>();

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

// Every transactional helper under test calls prisma.$transaction(async (tx) => ...)
// — running the callback against this same deep mock lets tx.xxx calls inside
// it resolve through the exact same mocked methods a test configures.
beforeEach(() => {
  mockReset(prismaMock);
  (prismaMock.$transaction as unknown as { mockImplementation: (fn: (arg: unknown) => unknown) => void }).mockImplementation(
    (arg: unknown) => {
      if (typeof arg === "function") {
        return (arg as (tx: typeof prismaMock) => unknown)(prismaMock);
      }
      return Promise.all(arg as Promise<unknown>[]);
    }
  );
});

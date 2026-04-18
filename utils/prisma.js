import { PrismaClient } from "@prisma/client";

/** @type {typeof globalThis & { prisma: PrismaClient | undefined }} */
const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

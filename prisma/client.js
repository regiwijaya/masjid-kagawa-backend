import { databaseUrl } from "../config/runtime.js";

// Dynamic import guarantees configuration is applied before Prisma loads.
const { PrismaClient } = await import("@prisma/client");

const globalForPrisma = globalThis;

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasourceUrl: databaseUrl(process.env.DATABASE_URL),
    log: ["warn", "error"],
  });

globalForPrisma.prisma = prisma;

export default prisma;

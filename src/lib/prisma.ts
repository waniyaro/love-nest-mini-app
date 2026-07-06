import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const getPrismaClient = (): PrismaClient => {
  // If no DATABASE_URL is set yet (e.g. initial setup placeholder), return client without adapter
  // to avoid pg error on startup, but during request execution it will fail if url is missing.
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString || connectionString.startsWith("postgres://postgres.xxxxxx")) {
    // Return standard client or stub if DB not configured yet, so pages can compile
    return new PrismaClient();
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
};

export const prisma = globalForPrisma.prisma ?? getPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL || "postgresql://dummy:dummy@localhost:5432/dummy",
    // @ts-expect-error directUrl is supported by Prisma but might not be in type definitions yet
    directUrl: process.env.DIRECT_URL,
  },
});

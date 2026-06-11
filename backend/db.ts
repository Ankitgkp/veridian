import { PrismaClient } from "./generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  return url;
}

const adapter = new PrismaPg({
  connectionString: getDatabaseUrl(),
});

export const prisma = new PrismaClient({
  adapter,
});



import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";
import { env } from "process";
import path from "path";
import { config } from "dotenv";

const { Pool } = pg;
config({ path: path.resolve(process.cwd(), ".env") });

console.log("Current DB URL:", process.env.DATABASE_URL);

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is missing!");
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });

import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { env } from "./env";
// import * as schema from "../db/schema";
// import { relations } from "../db/relations";

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
});
export const db: ReturnType<typeof drizzle> = drizzle({
  client: pool,
  // schema,
  // relations,
} as never);

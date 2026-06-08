import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL);
await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS attendees integer DEFAULT 0 NOT NULL`;
console.log("Done: added attendees column to events table");

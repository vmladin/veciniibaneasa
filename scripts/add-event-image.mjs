import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL);
await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS image varchar(500)`;
console.log("Done: added image column to events table");

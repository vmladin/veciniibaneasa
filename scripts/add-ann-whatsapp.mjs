import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL);

// Add whatsapp column
await sql`ALTER TABLE announcements ADD COLUMN IF NOT EXISTS whatsapp varchar(50)`;
console.log("Added whatsapp column to announcements");

// Backfill: copy contact → whatsapp for all existing rows
const result = await sql`
  UPDATE announcements
  SET whatsapp = contact
  WHERE contact IS NOT NULL AND contact != '' AND whatsapp IS NULL
`;
console.log("Backfilled whatsapp from contact:", result);

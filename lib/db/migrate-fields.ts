import { config } from "dotenv";
config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function migrate() {
  console.log("Adding new provider columns...");
  await sql`ALTER TABLE providers ADD COLUMN IF NOT EXISTS whatsapp varchar(50)`;
  await sql`ALTER TABLE providers ADD COLUMN IF NOT EXISTS price_range varchar(100)`;
  await sql`ALTER TABLE providers ADD COLUMN IF NOT EXISTS hours varchar(200)`;
  await sql`ALTER TABLE providers ADD COLUMN IF NOT EXISTS zone varchar(200)`;
  await sql`ALTER TABLE providers ADD COLUMN IF NOT EXISTS website varchar(200)`;
  await sql`ALTER TABLE providers ADD COLUMN IF NOT EXISTS social varchar(200)`;
  console.log("Done.");
  process.exit(0);
}

migrate().catch((e) => { console.error(e); process.exit(1); });

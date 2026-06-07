import { config } from "dotenv";
config({ path: ".env.local" });
import { neon } from "@neondatabase/serverless";

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  await sql`
    CREATE TABLE IF NOT EXISTS reports (
      id          SERIAL PRIMARY KEY,
      provider_id INTEGER NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
      provider_name VARCHAR(200) NOT NULL,
      reasons     TEXT NOT NULL,
      details     TEXT,
      resolved    BOOLEAN NOT NULL DEFAULT FALSE,
      created_at  TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;
  console.log("reports table ready.");
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });

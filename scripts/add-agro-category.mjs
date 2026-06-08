import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL);

await sql`
  INSERT INTO categories (name, slug, icon)
  VALUES ('Produse agroalimentare', 'agroalimentare', '🌾')
  ON CONFLICT (slug) DO NOTHING
`;
console.log("Added category: Produse agroalimentare 🌾");

import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL);

await sql`
  CREATE TABLE IF NOT EXISTS announcements (
    id          SERIAL PRIMARY KEY,
    type        VARCHAR(10)  NOT NULL,
    category    VARCHAR(100) NOT NULL,
    title       VARCHAR(200) NOT NULL,
    description TEXT,
    price       VARCHAR(100),
    images      TEXT,
    contact     VARCHAR(200),
    zone        VARCHAR(100),
    nickname    VARCHAR(100),
    resolved    BOOLEAN      NOT NULL DEFAULT FALSE,
    expires_at  TIMESTAMP    NOT NULL,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
  )
`;

console.log("✓ announcements table created (or already existed)");

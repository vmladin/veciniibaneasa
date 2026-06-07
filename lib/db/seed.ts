import { config } from "dotenv";
config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

const seedCategories = [
  { name: "Electrician", slug: "electrician", icon: "⚡" },
  { name: "Instalator", slug: "plumber", icon: "🔧" },
  { name: "Aer condiționat & Încălzire", slug: "ac-heating", icon: "❄️" },
  { name: "Frigidere & Electrocasnice", slug: "fridge-appliances", icon: "🧊" },
  { name: "Grădinar", slug: "gardener", icon: "🌿" },
  { name: "Curățătorie covoare & mochete", slug: "rug-cleaning", icon: "🏠" },
  { name: "Servicii de curățenie", slug: "cleaning", icon: "🧹" },
  { name: "Medic", slug: "doctor", icon: "🩺" },
  { name: "Stomatolog", slug: "dentist", icon: "🦷" },
  { name: "Meșter universal", slug: "handyman", icon: "🔨" },
  { name: "Zugrav", slug: "painter", icon: "🖌️" },
  { name: "Service auto", slug: "car-repair", icon: "🚗" },
  { name: "Lăcătuș / Yalelist", slug: "locksmith", icon: "🔑" },
  { name: "Dezinsecție & Deratizare", slug: "pest-control", icon: "🐛" },
  { name: "Altele", slug: "other", icon: "📋" },
];

async function seed() {
  console.log("Seeding categories...");
  for (const cat of seedCategories) {
    await db
      .insert(schema.categories)
      .values(cat)
      .onConflictDoUpdate({
        target: schema.categories.slug,
        set: { name: cat.name, icon: cat.icon },
      });
  }
  console.log("Done.");
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});

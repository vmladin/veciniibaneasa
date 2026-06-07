import {
  pgTable,
  serial,
  text,
  varchar,
  integer,
  real,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  icon: varchar("icon", { length: 10 }).notNull(),
});

export const providers = pgTable("providers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  whatsapp: varchar("whatsapp", { length: 50 }),
  email: varchar("email", { length: 200 }),
  description: text("description"),
  services: text("services"),
  priceRange: varchar("price_range", { length: 100 }),
  hours: varchar("hours", { length: 200 }),
  zone: varchar("zone", { length: 200 }),
  website: varchar("website", { length: 200 }),
  social: varchar("social", { length: 200 }),
  categoryId: integer("category_id")
    .notNull()
    .references(() => categories.id),
  address: text("address"),
  lat: real("lat"),
  lng: real("lng"),
  addedByNickname: varchar("added_by_nickname", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const reviews = pgTable(
  "reviews",
  {
    id: serial("id").primaryKey(),
    providerId: integer("provider_id")
      .notNull()
      .references(() => providers.id, { onDelete: "cascade" }),
    userUuid: varchar("user_uuid", { length: 36 }).notNull(),
    nickname: varchar("nickname", { length: 100 }).notNull(),
    rating: integer("rating").notNull(),
    comment: text("comment"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [unique("one_review_per_user").on(t.providerId, t.userUuid)]
);

export type Category = typeof categories.$inferSelect;
export type Provider = typeof providers.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type NewProvider = typeof providers.$inferInsert;
export type NewReview = typeof reviews.$inferInsert;

# Setup Guide — Vecinii Băneasa

## 1. Create Neon database

1. Go to neon.tech → create a free account → create a new project
2. Copy the **Connection string** (looks like `postgresql://user:pass@host/dbname?sslmode=require`)
3. Paste it into `.env.local` as `DATABASE_URL=...`

## 2. Set admin password

In `.env.local`, change `ADMIN_PASSWORD=` to something strong that only you know.
**The admin page URL is:** `/admin-vb-secret`

## 3. Push the schema to Neon

```bash
npm run db:push
```

This creates the `categories`, `providers`, and `reviews` tables.

## 4. Seed the categories

```bash
npm run db:seed
```

This inserts the 15 default categories (Electrician, Plumber, Gardener, etc.).

## 5. Run locally

```bash
npm run dev
```

Open http://localhost:3000

## 6. Deploy to Vercel

```bash
npx vercel
```

Or connect the GitHub repo at vercel.com.

**Add these environment variables in Vercel project settings:**
- `DATABASE_URL` — your Neon connection string
- `ADMIN_PASSWORD` — your secret admin password

## Admin panel

Navigate to `/admin-vb-secret` — enter your password once per browser session.
From there you can edit or delete any provider.

## Notes

- Each visitor gets a UUID stored in their browser's localStorage. This prevents duplicate reviews without requiring login.
- The map appears automatically on a provider's page if lat/lng coordinates were saved.
- Geocoding uses Nominatim (free, no API key needed).

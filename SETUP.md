# SideLootQuest — Setup

## 1. Clone and install

```bash
git clone https://github.com/Flawedporcelian/sidelootquest.git
cd sidelootquest
npm install
```

The `postinstall` script runs `prisma generate` automatically, which builds the typed Prisma client into `src/generated/prisma`.

## 2. Get a Postgres database (~2 min)

Fastest free option: **Neon** ([https://neon.tech](https://neon.tech))

1. Sign up (GitHub login works).
2. Create a new project. Any region near you is fine.
3. Copy the **connection string** (starts with `postgresql://...`). You'll need the **pooled** connection string for production; for dev either works.

Other options: Supabase, Railway, or local Postgres.

## 3. Create a GitHub OAuth app (~2 min)

1. Go to [github.com/settings/developers](https://github.com/settings/developers)
2. Click **New OAuth App**
3. Fill in:
   - **Application name**: SideLootQuest (local)
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`
4. Click **Register application**
5. Copy the **Client ID**
6. Click **Generate a new client secret** and copy it

## 4. Configure env vars

```bash
cp .env.example .env
```

Fill in:

| Variable | What to put |
|---|---|
| `DATABASE_URL` | Neon connection string from step 2 |
| `AUTH_SECRET` | Run `openssl rand -base64 32` and paste the output |
| `AUTH_GITHUB_ID` | GitHub OAuth Client ID from step 3 |
| `AUTH_GITHUB_SECRET` | GitHub OAuth Client Secret from step 3 |

## 5. Push the schema to your DB

```bash
npx prisma db push
```

(Use `db push` for dev. For prod, switch to migrations: `npx prisma migrate dev --name init`.)

Optional — seed some demo data (note: seed user won't be accessible via OAuth, it's just for DB inspection in `prisma studio`):

```bash
npm run db:seed
```

## 6. Run it

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and click **Sign in**.

---

## Deploying to Vercel

1. Push your repo to GitHub.
2. Go to [vercel.com/new](https://vercel.com/new) and import the repo.
3. **Environment Variables** (add all four from your `.env`):
   - `DATABASE_URL` — use your Neon **pooled** connection string here
   - `AUTH_SECRET`
   - `AUTH_GITHUB_ID`
   - `AUTH_GITHUB_SECRET`
4. Also add: `AUTH_TRUST_HOST=true`
5. Click **Deploy**.

Once deployed, update your GitHub OAuth app:

- **Homepage URL**: `https://your-domain.vercel.app`
- **Authorization callback URL**: `https://your-domain.vercel.app/api/auth/callback/github`

Or create a **separate** GitHub OAuth app for production and keep localhost/prod env vars separate (recommended).

---

## Daily development loop

```bash
# Open Prisma Studio to inspect the DB
npm run db:studio

# After changing schema.prisma
npm run db:push          # dev — overwrites schema, no history
# OR
npm run db:migrate       # prod — creates a migration file

# Check types
npx tsc --noEmit

# Lint
npm run lint

# Build (catches SSR issues)
npm run build
```

---

## Troubleshooting

**"Cannot find module '@/generated/prisma'"** — run `npx prisma generate`.

**"Invalid `prisma.X.Y()` invocation: cannot connect"** — your `DATABASE_URL` is wrong or Neon is asleep. Test with `npx prisma db pull`.

**Sign-in loops back to `/signin`** — triple-check your GitHub OAuth callback URL matches the host exactly. `http://localhost:3000` not `http://127.0.0.1:3000`.

**`AUTH_TRUST_HOST` error on Vercel** — add `AUTH_TRUST_HOST=true` to env vars.

**NextAuth session undefined** — confirm `AUTH_SECRET` is set and not an empty string.

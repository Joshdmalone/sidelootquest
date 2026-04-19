# SideLootQuest — Setup

## Local quick start (zero external services)

```bash
git clone https://github.com/Joshdmalone/sidelootquest.git
cd sidelootquest
npm install
cp .env.example .env
npm run db:push       # creates dev.db file
npm run db:seed       # optional — seeds demo data
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) → click **Start your quest** → click **Dev sign in (no account)**. Done.

You're now signed in as `dev@sidelootquest.local` with sample projects, clients, and tasks.

### What just happened?

- **Database**: SQLite file at `./dev.db` (no Postgres, no Docker). Safe to delete and re-run `db:push` anytime.
- **Auth**: The "Dev sign in" button uses NextAuth's Credentials provider, automatically logging you in as the seed user. It's enabled via `ALLOW_DEV_SIGNIN=true` and only works in development.
- **No GitHub OAuth needed** for local.

---

## Deploying to production

Prod needs two things local dev didn't:

1. **Real hosted database** (libsql/Turso recommended, since we already use the libsql adapter)
2. **GitHub OAuth app** (so real users can sign in)

### 1. Get a hosted libsql database (~2 min) — Turso

- Go to [turso.tech](https://turso.tech) → sign up with GitHub
- Install Turso CLI: [docs](https://docs.turso.tech/quickstart) (or use the web UI)
- Create a database, copy:
  - `DATABASE_URL` — the libsql:// URL
  - `DATABASE_AUTH_TOKEN` — the auth token

### 2. Create GitHub OAuth app (~2 min)

- [github.com/settings/developers](https://github.com/settings/developers) → **New OAuth App**
- **Homepage URL**: `https://your-domain.vercel.app`
- **Callback URL**: `https://your-domain.vercel.app/api/auth/callback/github`
- Copy the Client ID + Client Secret.

### 3. Configure Vercel env vars

In your Vercel project → **Settings → Environment Variables** (Production):

| Variable | Value |
|---|---|
| `DATABASE_URL` | Turso libsql:// URL |
| `DATABASE_AUTH_TOKEN` | Turso auth token |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `AUTH_GITHUB_ID` | GitHub OAuth Client ID |
| `AUTH_GITHUB_SECRET` | GitHub OAuth Client Secret |
| `AUTH_TRUST_HOST` | `true` |
| `ALLOW_DEV_SIGNIN` | `false` (critical — don't leave dev bypass on in prod!) |

### 4. Push schema to the hosted DB

From local:

```bash
vercel env pull .env.production.local
cp .env.production.local .env
npm run db:push
```

### 5. Deploy

```bash
vercel --prod
```

Or just push to `main` — Vercel auto-deploys.

---

## Daily loop

```bash
npm run dev              # dev server (Turbopack)
npm run db:studio        # Prisma Studio — visual DB browser
npm run db:push          # after editing schema.prisma
npm run db:seed          # reset to demo data
npx tsc --noEmit         # type-check
npm run lint             # eslint
npm run build            # full production build
```

---

## Troubleshooting

**`DATABASE_URL is not set`** — you didn't copy `.env.example` to `.env`.

**`Cannot find module '@/generated/prisma/client'`** — run `npx prisma generate`.

**"Dev sign in" button missing** — check `.env` has `ALLOW_DEV_SIGNIN="true"`. It's auto-on in development so usually fine; explicitly disabled only in production.

**Dev sign-in loops** — delete `dev.db` and re-run `npm run db:push && npm run db:seed`.

**Changes to schema not reflected** — run `npm run db:push` after editing `prisma/schema.prisma`, then restart dev server (`prisma generate` runs via postinstall and on every push).

**GitHub sign-in 500 on localhost** — triple-check callback URL matches host exactly (`http://localhost:3000`, not `127.0.0.1`).

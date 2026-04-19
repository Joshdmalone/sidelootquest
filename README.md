# SideLootQuest

> **Level up your side hustle. Track the loot.**

A task manager built for people building something after 5pm.

Works like TickTick or Todoist — plus three things those can't do:

- **Track revenue per task** (hourly rate or fixed price)
- **Set aside tax** automatically on every dollar earned
- **Clock billable hours** right from the Pomodoro timer

## Why this exists

General task managers (TickTick, Todoist, Things, TickTick) treat every task the same. But a side hustler's task isn't a chore — it's a *revenue event*. SideLootQuest knows the difference.

## Features

| | SideLootQuest | TickTick / Todoist |
|---|:-:|:-:|
| Tasks, projects, tags, priorities | ✓ | ✓ |
| Natural-language dates (`tomorrow 3pm`) | ✓ | ✓ |
| Pomodoro / focus timer | ✓ (free) | ✓ (paywalled) |
| Revenue tracking per task | ✓ | — |
| Billable-time logging against tasks | ✓ | — |
| Tax set-aside jar | ✓ | — |
| Client-level revenue view | ✓ | — |
| Weekly earnings goal + pace | ✓ | — |

## Stack

- **Next.js 16** (App Router, Turbopack)
- **React 19.2**
- **Prisma 7** + **SQLite** (via libsql adapter — zero-setup local, Turso for prod)
- **NextAuth v5** (GitHub OAuth + dev-mode Credentials bypass)
- **Tailwind CSS v4** + shadcn-style Radix primitives
- **TypeScript** end-to-end
- Dark-first UI (this is an after-5pm app)

## Quick start (zero external services)

```bash
git clone https://github.com/Joshdmalone/sidelootquest.git
cd sidelootquest
npm install
cp .env.example .env
npm run db:push && npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) → click **Dev sign in** → you're in.

See [SETUP.md](./SETUP.md) for deployment to Vercel with Turso + GitHub OAuth.

## Roadmap

See [ROADMAP.md](./ROADMAP.md) for what's next — prioritized list with difficulty ratings and specific files to touch.

## Contributing

This is an early-stage project. PRs welcome. See [CLAUDE.md](./CLAUDE.md) for code conventions if you (or your AI assistant) are hacking on it.

## License

MIT

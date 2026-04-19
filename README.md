# SideLootQuest

> **Level up your side hustle. Track the loot.**

A task + productivity suite for people building something after 5pm — the freelancers, consultants, moonlighters, and "I'm gonna start my own thing" crowd.

It does everything a normal task app does (Kanban, Pomodoro, natural-language dates), plus **four things those can't do**:

- **💰 Revenue tracking per task** — tag any task as `$/hour` or `$fixed` and it flows into your income dashboard
- **🏦 Auto tax set-aside** — every completed paid task skims 25–30% into a "tax jar" so April doesn't burn you
- **⏱️ Billable timer** — the Pomodoro is also a clock; hours logged against a hourly task = money earned
- **🎨 Freeform canvas dashboard** — an infinite-zoom whiteboard-style board with draggable widgets: notes, sketches, timers, habit rings, mini task lists. Perfect for brainstorming a launch, sketching a funnel, or just dumping what's in your head.

## What's inside

| Page | What it does |
|---|---|
| **`/tasks`** | Kanban board with custom editable columns. Click "+ Add task" in any column → empty card appears and you type inline. Drag between columns. Per-task priority + project + client + `$rate`. |
| **`/board`** | Infinite-zoom canvas. Spawn widgets from the left panel — Note, **Whiteboard (drawing)**, Timer, Habit tracker, Quick Tasks. All draggable, resizable, colorable. Autosaves on every change. |
| **`/focus`** | Pomodoro + billable-hours timer in one. Today's focus hours + billable hours at the top. Pick a task → start → hours log against it → revenue accrues. |
| **`/loot`** | Revenue dashboard. WTD / MTD / YTD earnings, weekly-goal progress bar, tax jar, effective $/hour, per-client breakdown. |
| **`/projects`** & **`/clients`** | Group tasks. Clients show running revenue earned. |
| **`/settings`** | Tax rate, weekly goal, timezone, theme. |

## Features vs the rest

| | SideLootQuest | TickTick / Todoist | Trello / Notion |
|---|:-:|:-:|:-:|
| Kanban board | ✓ | partial | ✓ |
| Natural-language dates | ✓ | ✓ | — |
| Pomodoro / focus timer | ✓ (free) | ✓ (paywalled) | — |
| Freeform canvas + whiteboard | ✓ | — | partial |
| **Revenue tracking per task** | ✓ | — | — |
| **Billable-time logging** | ✓ | — | — |
| **Tax set-aside jar** | ✓ | — | — |
| **Client-level revenue view** | ✓ | — | — |
| Weekly earnings goal | ✓ | — | — |
| Self-hostable + open source | ✓ | — | — |

## Stack

- **Next.js 16** (App Router, Turbopack) + React 19.2
- **Prisma 7** + **SQLite** via libsql adapter (zero-setup local, Turso for prod)
- **NextAuth v5** (GitHub OAuth + dev-mode Credentials bypass)
- **Tailwind CSS v4** + shadcn-style Radix primitives
- **chrono-node** for date parsing
- TypeScript end-to-end, all money as cents (never float)

## Quick start (3 minutes, zero external services)

```bash
git clone https://github.com/Flawedporcelian/sidelootquest.git
cd sidelootquest
npm install
cp .env.example .env
npm run db:push && npm run db:seed
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** → click **Dev sign in (no account)** → you're in with sample data.

See [SETUP.md](./SETUP.md) for deploying to Vercel with Turso + GitHub OAuth (another ~10 min).

## Roadmap

[ROADMAP.md](./ROADMAP.md) has 20+ prioritized next features with difficulty ratings (🟢🟡🔴) and specific files to touch. Start with the 🟢 ones:

- Recurring tasks (`rrule`, ~2 hrs)
- Subtasks (self-relation, ~2 hrs)
- "After-5pm mode" — hides day-job tasks outside work hours
- Energy tagger — Deep / Shallow / Admin, surface matching tasks by time of day
- PWA manifest + service worker (installable app)
- Keyboard shortcuts + command palette

## Contributing

Open to PRs. See [CLAUDE.md](./CLAUDE.md) for code conventions — useful if you (or your AI assistant) hack on it. Key points:

- Prisma imports from `@/generated/prisma/client`, **not** `@prisma/client`
- All mutations go through server actions in `src/app/(app)/actions.ts`
- Every authed action calls `requireUser()` and scopes queries by `userId`
- Money is always `Int` cents

## License

[MIT](./LICENSE)

# SideLootQuest — One-Page Pitch

## The problem

There are ~70 million side hustlers in the US alone, and every one of them juggles three things general task apps pretend are unrelated:

1. **What do I need to do** (tasks, deadlines)
2. **How much am I earning** (revenue, hours)
3. **What do I owe on it** (taxes, client invoicing)

Todoist, TickTick, Notion, Trello — none of them know a task can be worth money. Side hustlers end up duct-taping:

- Todoist for tasks
- Toggl for hours
- Google Sheets for revenue
- QuickBooks Self-Employed for taxes
- Miro/FigJam for brainstorming

That's $40–60/month of tool stack for a hustle that hasn't even paid for itself yet.

## The insight

A side hustler's task isn't a chore — **it's a revenue event.** Every "finish client logo" is a $500 line item. Every "coaching call at 3pm" is $150/hour × 1 hour. The task manager already knows *when* the work happens; it just doesn't know *what it pays*.

If one app knew that, it could do the math for you automatically.

## What SideLootQuest does

One app. Five intertwined views:

1. **Kanban tasks** — with per-task `$rate` or `$fixed` price. Feels like Trello.
2. **Pomodoro / billable timer** — same UI, two modes. Billable mode logs hours against a task.
3. **Revenue dashboard** — WTD/MTD/YTD, weekly goal, effective $/hour, per-client breakdown.
4. **Tax jar** — 25–30% of every completed paid task auto-skims into a set-aside total.
5. **Freeform canvas** — drag-to-zoom board with notes, whiteboard, timers, habit rings. Think Miro + TickTick in one.

All dark-mode native. Clean, keyboard-friendly, open source.

## Why this wins

- **Replaces 3–5 apps in a side hustler's stack.** Less tool fatigue, less context switching.
- **The money features are the moat.** Task management is commodity; tax/revenue/billing automation is not.
- **Infinite-canvas dashboard is a wedge** — most task apps feel claustrophobic. This one feels like a workshop.
- **Open-source + self-hostable** — earns trust fast with indie hackers and devs (the highest-propensity users to pay).

## Who buys this

- **Freelance designers / devs / writers** working a day job
- **Course creators / content creators** with a Stripe account
- **Coaches / consultants** doing hourly work
- **Moonlighters** testing a SaaS idea alongside a 9-to-5
- **Etsy / eBay / Depop sellers** tracking tasks and take-home

Rough TAM: 70M US side hustlers × 1% reachable × $8/month = **$67M ARR ceiling in the US alone.**

## Pricing (proposed)

- **Free forever** — all core features (tasks, Kanban, revenue tracking, tax jar, canvas, whiteboard). The money features stay free — that's the differentiator.
- **Pro — $8/mo or $60/yr** — invoice PDFs, recurring tasks, team/collab, Stripe payout import, weekly email digest, custom domains, priority support.
- **Team / Agency — $20/user/mo** — shared projects, shared clients, multi-user invoicing. (Later.)

Side hustlers think in $/month of tool spend. $8 is an "obvious yes" if it replaces $40 of competitors.

## Competitive landscape

| | Tasks | Time | Revenue | Taxes | Canvas | Price |
|---|:-:|:-:|:-:|:-:|:-:|---|
| Todoist | ✓ | — | — | — | — | $4/mo |
| TickTick | ✓ | ✓ paywalled | — | — | — | $3/mo |
| Notion | ✓ | — | manual | — | partial | $10/mo |
| Toggl | — | ✓ | — | — | — | $10/mo |
| FreshBooks | — | ✓ | ✓ | partial | — | $17/mo |
| **SideLootQuest** | ✓ | ✓ | ✓ | ✓ | ✓ | $0–8/mo |

Nobody is running this bundle at this price point. The closest is FreshBooks at ~2× the cost with a much worse task experience.

## What's built

**MVP shipped (local-first, self-hostable):**

- ✅ Kanban tasks with custom columns, inline add, drag
- ✅ Natural-language date parsing
- ✅ Projects + clients with per-client revenue
- ✅ Hustle Mode — `$rate` or `$fixed` per task
- ✅ Pomodoro + billable-hours timer
- ✅ Revenue dashboard (WTD/MTD/YTD), tax jar, weekly goal
- ✅ Freeform canvas `/board` with 5 widgets — Note, **Whiteboard**, Timer, Habit, Quick Tasks
- ✅ Light / dark / system theme
- ✅ GitHub OAuth + dev-mode passwordless signin
- ✅ Full TypeScript, Prisma-typed, open source

**Next 30 days (see ROADMAP.md):**

- Recurring tasks (cron-like)
- Subtasks
- Invoice PDF generation
- Weekly digest email
- Keyboard shortcuts + command palette
- PWA installable

**Next 90 days:**

- Real-time collaboration (Liveblocks)
- Stripe/PayPal payout import
- Mobile app (React Native, Expo)
- Client portal (share invoice + progress view)

## Go-to-market

1. **Launch on Product Hunt** — dark-mode + "infinite canvas" + "side hustler taxes" = three hooks HN loves
2. **Indie Hackers thread** — show the revenue tracking in action
3. **r/sidehustle, r/freelance, r/juststart** — before/after screenshots of someone's scattered tool stack collapsed into one
4. **YouTube devtubers** — open source + interesting stack is their bait
5. **Twitter devs** — hook: "I built a task app that tracks my freelance revenue in real time"

Cost to CAC: near zero until ~$5k MRR. Then consider Reddit ads at $3-5 CPC into /r/freelance traffic.

## The ask

- Repo: [github.com/Flawedporcelian/sidelootquest](https://github.com/Flawedporcelian/sidelootquest)
- Built weekend 1. Deployable to Vercel in 10 min (Turso DB + GitHub OAuth).
- Open to feedback, collaborators, or just "this is neat, good luck."

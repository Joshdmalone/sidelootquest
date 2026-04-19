# Roadmap

Everything below is **not yet built** — these are the obvious next features that would take SideLootQuest from an MVP to a TickTick replacement.

Difficulty scale: 🟢 easy (hours) · 🟡 moderate (a weekend) · 🔴 big (1+ week)

---

## Parity with TickTick / Todoist

### 🟢 Recurring tasks
Repeat every day / week / month. Store an RRULE string on `Task`, regenerate on completion.

**Files to touch:**
- `prisma/schema.prisma` — add `recurrence String?` to `Task`
- `src/app/(app)/tasks/tasks-view.tsx` — add recurrence picker in new-task dialog
- `src/app/(app)/actions.ts` — on `toggleTask(true)` for recurring tasks, create next instance
- Dep: add [`rrule`](https://www.npmjs.com/package/rrule)

### 🟢 Subtasks
Tree-structured tasks. Add `parentId String?` self-relation to `Task`.

### 🟢 Drag-to-reorder
Tasks already have `sortOrder Int`. Wire up [@dnd-kit/sortable](https://dndkit.com).

### 🟡 Tags UI
Schema (`Tag`, `TaskTag`) exists. Need: tag CRUD UI, tag filter on tasks page.

### 🟡 Calendar view
Month/week grid of tasks by `dueAt`. Use [react-big-calendar](https://github.com/jquense/react-big-calendar) or build custom.

### 🟡 Habit tracker
TickTick paywalls this — make it free. New `Habit` model + daily completion grid.

### 🟡 Eisenhower matrix view
Quadrant view of tasks (urgent×important). Uses existing `priority` + `dueAt`. Pure UI work.

### 🔴 Mobile apps
React Native (Expo). Share Prisma types, talk to the existing API routes.

### 🔴 Real-time collab
Shared projects/lists. Biggest schema change (ACL table, invites). Consider [Liveblocks](https://liveblocks.io/) or Pusher.

---

## Side-hustler moat expansion

### 🟢 After-5pm mode
Toggle in Settings. Hides day-job tasks (those without `billingType`) outside work hours. One boolean + a filter.

### 🟢 Energy tagger
Tag tasks as `DEEP` / `SHALLOW` / `ADMIN`. Surface matching ones based on current time/day.

**Files:** `prisma/schema.prisma` (add `energyLevel` enum), task form, filter on `/tasks`.

### 🟡 Invoice PDF
One click → generate invoice for a client's unpaid completed tasks. Use [react-pdf](https://react-pdf.org/) or [Puppeteer on Vercel](https://vercel.com/templates/next.js/pdf-generator).

**Files:**
- New `src/app/(app)/clients/[id]/invoice/page.tsx`
- `Task` needs `invoicedAt DateTime?` field
- Add "Create invoice" button in clients page

### 🟡 Weekly digest email
Friday 6pm: *"This week you earned $X, logged Yh, hit Z% of goal."*
Use Vercel Cron + [Resend](https://resend.com) for email.

### 🟡 Expense tracker
Business expenses reduce tax jar. New `Expense` model. Nets expenses against earnings for a more accurate jar.

### 🟡 Stripe payouts import
Import Stripe charges → auto-mark matching tasks as paid. Needs Stripe OAuth + webhook.

### 🔴 Client portal
Share a read-only view with a client: "here's the invoice, here's what I've shipped."

---

## Polish / quality

### 🟢 PWA (installable app)
Add manifest.json + service worker. Works offline-ish for reading tasks. Vercel has templates.

### 🟢 Keyboard shortcuts
`c` = new task · `/` = search · `g t` = go to tasks · `x` = complete
Use [cmdk](https://cmdk.paco.me/) for command palette.

### 🟢 Dark/light toggle
Currently dark-only (intentional — this is a night-mode app). But add `.system` class to `<html>` based on toggle, CSS already supports light.

### 🟢 Task search
Full-text over `title` + `notes`. Postgres `ILIKE '%q%'` is fine at MVP scale. Add Postgres full-text index later.

### 🟡 Natural-language date improvements
`chrono-node` handles most cases. But parsing "every Monday" etc for recurrence needs work.

### 🟡 Task edit (currently only create)
Click task → open edit dialog (reuse `NewTaskDialog` with `initial` prop).

### 🟡 Import from TickTick/Todoist
Both export CSV. Build an `/import` page that parses + bulk-creates.

---

## Infrastructure / ops

### 🟢 Error monitoring
[Sentry](https://sentry.io) — 10 minutes to wire up. Free tier is fine.

### 🟢 Rate limiting
NextAuth + server actions need basic rate limiting. Use [@upstash/ratelimit](https://github.com/upstash/ratelimit) with Vercel KV.

### 🟡 CI
GitHub Actions: run `tsc --noEmit`, `npm run lint`, `npm run build` on every PR.

### 🟡 Testing
Vitest for unit tests on `src/lib/*`. Playwright for a happy-path e2e.

---

## Architecture notes for future you

- **Money is stored in cents (integers).** Never use floats for money. See `src/lib/utils.ts#formatMoney`.
- **Dates come from the DB as JS `Date` objects.** Prisma handles this.
- **Revenue is computed on read, not stored.** See how `/loot` and `/clients` derive earnings from completed tasks + time entries. This makes rate/price edits retroactive, which is usually what you want.
- **Prisma client imports from `@/generated/prisma`**, not `@prisma/client`. Prisma 7 generator outputs self-contained code into `src/generated/prisma/`.
- **Server actions live in `src/app/(app)/actions.ts`** — all DB writes go through them. Reads are fine in Server Components.
- **`requireUser()` in `src/lib/auth.ts`** is the auth guard. Use it in server actions; use `redirect('/signin')` manually in server components if you need a custom redirect.

---

## Things to decide later (pricing / business)

- **Free forever vs. freemium?** TickTick's playbook = paywall habits + calendar. SideLootQuest's wedge is the money features — those should probably stay free to be the differentiator. Paywall could be: team/collab, custom integrations, unlimited clients.
- **Pricing idea**: $8/mo or $60/year. Side hustlers think in $/month of tool spend.
- **Domain**: `sidelootquest.com` · `sidelootquest.app` · `trysidelootquest.com` — grab whichever's cleanest.

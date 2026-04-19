@AGENTS.md

# SideLootQuest — code conventions

This file teaches AI assistants (Claude Code, Cursor, etc.) the conventions of this codebase so they write code that fits.

## Stack specifics

- **Next.js 16** with App Router + Turbopack. Async `cookies()`, `headers()`, `params`, `searchParams` — must `await` them.
- **React 19.2** — Server Components by default. `"use client"` only when needed (interactivity, hooks, browser APIs).
- **Prisma 7** with the new `prisma-client` generator. Import from `@/generated/prisma`, **NOT** `@prisma/client`. The client is generated into `src/generated/prisma/` (gitignored).
- **NextAuth v5 beta** — config in `src/lib/auth.ts`. Exports `auth()`, `signIn()`, `signOut()`, `handlers`.
- **Tailwind v4** with `@theme inline` in `globals.css`. Use CSS vars like `bg-[color:var(--gold)]` for the brand palette, or semantic tokens (`bg-primary`, `bg-muted`).

## Folder structure

```
src/
  app/
    (app)/              # Authenticated routes — shared layout at (app)/layout.tsx guards auth
      tasks/            # route-segments are thin; heavy UI is in co-located components
      projects/
      clients/
      focus/
      loot/
      settings/
      actions.ts        # ALL server actions for the authed app live here
    api/auth/[...nextauth]/route.ts  # NextAuth handler re-export
    page.tsx            # Landing
    signin/page.tsx     # Sign-in
    layout.tsx          # Root
    globals.css
  components/
    ui/                 # shadcn-style primitives — Button, Input, Card, etc.
    sidebar.tsx         # App sidebar nav
  lib/
    auth.ts             # NextAuth config + requireUser()
    prisma.ts           # Prisma client singleton
    nlp-date.ts         # chrono-node wrapper
    utils.ts            # cn(), formatMoney(), etc.
  generated/prisma/     # Prisma client (gitignored)
  types/
    next-auth.d.ts      # NextAuth session type augmentation
prisma/
  schema.prisma
  seed.ts
```

## Patterns

### Reading data
Server Components call `prisma` directly. Example: `src/app/(app)/tasks/page.tsx`.

```ts
const session = await auth();
if (!session?.user?.id) redirect("/signin");
const tasks = await prisma.task.findMany({ where: { userId: session.user.id } });
```

### Writing data — always through server actions
All mutations live in `src/app/(app)/actions.ts`. Pattern:

```ts
"use server";
export async function createX(formData: FormData) {
  const user = await requireUser();
  const parsed = SomeZodSchema.parse(Object.fromEntries(formData.entries()));
  await prisma.x.create({ data: { userId: user.id, ...parsed } });
  revalidatePath("/x");
}
```

Zod validates at the action boundary. After write, call `revalidatePath()` for affected routes.

### Client components
Named file: `foo-view.tsx` inside the route folder. Starts with `"use client"`. Takes props from the server page.

### Forms
Use plain `<form>` with `action={serverAction}` (no RHF). Or for dialogs, `onSubmit` + `useTransition` + `startTransition(async () => { await action(fd); close() })`.

### Money
Stored in **cents as Int**. Never float. Render with `formatMoney()` from `@/lib/utils`.

### Dates
Stored as `DateTime`. Parse user input with `parseTaskInput()` from `@/lib/nlp-date`. Format with `date-fns`.

### Styling
- `cn()` helper merges class lists (tailwind-merge + clsx).
- Prefer semantic tokens (`bg-primary`, `text-muted-foreground`) over raw colors.
- Gold is the money color: `text-[color:var(--gold)]` / `bg-[color:var(--gold)]`.
- Primary (violet) is the action color.
- UI is dark-first — light mode CSS exists but isn't exposed yet.

## What NOT to do

- Don't import from `@prisma/client` — use `@/generated/prisma`.
- Don't call `prisma` from client components — go through a server action.
- Don't store money as a float.
- Don't store computed revenue on tasks — compute it on read so rate edits are retroactive.
- Don't add third-party deps without checking if we already have one that does the job (we already have Radix, Lucide, date-fns, zod, chrono-node).
- Don't bypass `requireUser()` — every authed action must confirm ownership via `userId`.

## Testing before committing

```bash
npx tsc --noEmit     # type check
npm run lint         # ESLint
npm run build        # catches SSR/server-component issues
```

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Swords, ListChecks, FolderKanban, Users, Timer, Coins, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/tasks", label: "Tasks", icon: ListChecks },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/focus", label: "Focus", icon: Timer },
  { href: "/loot", label: "Loot", icon: Coins },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar({
  user,
}: {
  user: { name?: string | null; email?: string | null; image?: string | null };
}) {
  const pathname = usePathname();
  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-card">
      <Link href="/tasks" className="flex h-14 items-center gap-2 border-b border-border px-6">
        <Swords className="h-5 w-5 text-primary" />
        <span className="font-bold tracking-tight">SideLootQuest</span>
      </Link>

      <nav className="flex-1 space-y-1 p-3">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-accent text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        <div className="flex items-center gap-3 rounded-md px-3 py-2">
          {user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.image} alt="" className="h-7 w-7 rounded-full" />
          ) : (
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              {(user.name || user.email || "?")[0]?.toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium">{user.name || user.email}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

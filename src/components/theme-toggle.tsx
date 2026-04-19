"use client";

import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

/** Three-way theme toggle — light / system / dark. Compact horizontal pill. */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="inline-flex items-center gap-0.5 rounded-full border border-border bg-muted p-0.5">
      <ThemeButton label="Light" icon={Sun} active={theme === "light"} onClick={() => setTheme("light")} />
      <ThemeButton label="System" icon={Monitor} active={theme === "system"} onClick={() => setTheme("system")} />
      <ThemeButton label="Dark" icon={Moon} active={theme === "dark"} onClick={() => setTheme("dark")} />
    </div>
  );
}

function ThemeButton({
  label,
  icon: Icon,
  active,
  onClick,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={cn(
        "flex h-6 w-6 items-center justify-center rounded-full transition-colors",
        active ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      <span className="sr-only">{label}</span>
    </button>
  );
}

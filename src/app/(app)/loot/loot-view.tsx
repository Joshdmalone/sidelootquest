import Link from "next/link";
import { Coins, PiggyBank, Target, TrendingUp, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/utils";

export function LootView({
  wtdCents,
  mtdCents,
  ytdCents,
  allTimeCents,
  taxJarCents,
  taxRatePct,
  weeklyGoalCents,
  weekProgress,
  effectiveHourlyCents,
  billableHoursYTD,
  clientRows,
}: {
  wtdCents: number;
  mtdCents: number;
  ytdCents: number;
  allTimeCents: number;
  taxJarCents: number;
  taxRatePct: number;
  weeklyGoalCents: number;
  weekProgress: number;
  effectiveHourlyCents: number;
  billableHoursYTD: number;
  clientRows: { name: string; cents: number; tasks: number }[];
}) {
  return (
    <div className="mx-auto max-w-5xl p-6 md:p-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Loot</h1>
        <p className="text-sm text-muted-foreground">
          Money earned from completed billable tasks. Tax set-aside runs automatically.
        </p>
      </div>

      {/* Headline grid */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Metric label="This week" value={formatMoney(wtdCents)} accent="gold" />
        <Metric label="This month" value={formatMoney(mtdCents)} />
        <Metric label="Year to date" value={formatMoney(ytdCents)} />
        <Metric label="All time" value={formatMoney(allTimeCents)} />
      </div>

      {/* Weekly goal */}
      {weeklyGoalCents > 0 ? (
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                <span className="font-medium">Weekly goal</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {formatMoney(wtdCents)} / {formatMoney(weeklyGoalCents)}
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-[color:var(--gold)] transition-all"
                style={{ width: `${weekProgress * 100}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {weekProgress >= 1
                ? "🎯 Goal smashed. Legendary."
                : `${Math.round(weekProgress * 100)}% of goal. ${formatMoney(Math.max(0, weeklyGoalCents - wtdCents))} to go.`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-6">
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            <Target className="mx-auto mb-2 h-5 w-5" />
            Set a weekly loot goal in{" "}
            <Link href="/settings" className="text-primary underline-offset-4 hover:underline">
              Settings
            </Link>{" "}
            to see pace tracking.
          </CardContent>
        </Card>
      )}

      {/* Tax jar + effective rate */}
      <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <div className="mb-2 flex items-center gap-2">
              <PiggyBank className="h-4 w-4 text-[color:var(--gold)]" />
              <span className="font-medium">Tax jar</span>
              <Badge variant="outline">{taxRatePct}%</Badge>
            </div>
            <p className="text-2xl font-bold text-[color:var(--gold)]">
              {formatMoney(taxJarCents)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Set aside {taxRatePct}% of all-time earnings. Adjust in Settings.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="mb-2 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="font-medium">Effective $/hour</span>
              <span className="text-xs text-muted-foreground">(YTD)</span>
            </div>
            <p className="text-2xl font-bold">
              {formatMoney(effectiveHourlyCents)}/hr
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {billableHoursYTD.toFixed(1)}h logged this year.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Per client */}
      <Card>
        <CardContent className="p-6">
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <span className="font-medium">By client</span>
          </div>
          {clientRows.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              <Coins className="mx-auto mb-2 h-5 w-5" />
              No billable completed tasks yet. Complete some to see the loot stack up.
            </p>
          ) : (
            <div className="space-y-2">
              {clientRows.map((c) => (
                <div key={c.name} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.tasks} tasks</p>
                  </div>
                  <p className="font-semibold text-[color:var(--gold)]">{formatMoney(c.cents)}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({ label, value, accent }: { label: string; value: string; accent?: "gold" }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p
          className={
            accent === "gold"
              ? "mt-1 text-2xl font-bold text-[color:var(--gold)]"
              : "mt-1 text-2xl font-bold"
          }
        >
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

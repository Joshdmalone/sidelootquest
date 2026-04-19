"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { updateSettings } from "../actions";

export function SettingsView({
  initial,
}: {
  initial: {
    taxRatePct: number;
    weeklyGoalDollars: number;
    timezone: string;
    email: string;
    name: string;
  };
}) {
  const [saved, setSaved] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      await updateSettings(fd);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    });
  }

  return (
    <div className="mx-auto max-w-2xl p-6 md:p-10">
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Settings</h1>

      <Card className="mb-6">
        <CardContent className="p-6">
          <h2 className="mb-4 font-semibold">Account</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Name</span>
              <span>{initial.name || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span>{initial.email}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardContent className="space-y-6 p-6">
            <h2 className="font-semibold">Hustle settings</h2>

            <div>
              <Label className="mb-1 block text-sm">Tax set-aside (%)</Label>
              <Input
                name="taxRatePct"
                type="number"
                min="0"
                max="60"
                step="1"
                defaultValue={initial.taxRatePct}
                required
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Percent of each dollar earned to keep in the tax jar. Most side hustlers set 25–30%.
              </p>
            </div>

            <div>
              <Label className="mb-1 block text-sm">Weekly loot goal ($)</Label>
              <Input
                name="weeklyGoalDollars"
                type="number"
                min="0"
                step="50"
                defaultValue={initial.weeklyGoalDollars}
                placeholder="500"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Target revenue per week. Set 0 to hide the progress bar.
              </p>
            </div>

            <div>
              <Label className="mb-1 block text-sm">Timezone</Label>
              <Input
                name="timezone"
                defaultValue={initial.timezone}
                placeholder="America/New_York"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Used for &quot;today&quot;, &quot;this week&quot;, etc.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3">
              {saved && <span className="text-xs text-[color:var(--gold)]">Saved ✓</span>}
              <Button type="submit" variant="gold" disabled={pending}>
                {pending ? "Saving…" : "Save"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}

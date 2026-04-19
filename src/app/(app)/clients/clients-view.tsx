"use client";

import * as React from "react";
import { Plus, Trash2, Users, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { createClient, deleteClient } from "../actions";
import { formatMoney } from "@/lib/utils";

type ClientRow = {
  id: string;
  name: string;
  email: string | null;
  notes: string | null;
  taskCount: number;
  projectCount: number;
  earnedCents: number;
};

export function ClientsView({ clients }: { clients: ClientRow[] }) {
  const [pending, startTransition] = React.useTransition();

  return (
    <div className="mx-auto max-w-4xl p-6 md:p-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clients</h1>
          <p className="text-sm text-muted-foreground">
            Who&apos;s paying the bills. Tracked revenue per client.
          </p>
        </div>
        <NewClientDialog />
      </div>

      {clients.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center">
            <Users className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No clients yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {clients.map((c) => (
            <Card key={c.id}>
              <CardContent className="flex items-center justify-between gap-4 p-4">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{c.name}</p>
                  {c.email && (
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      {c.email}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {c.projectCount} projects · {c.taskCount} tasks
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Earned</p>
                  <p className="font-semibold text-[color:var(--gold)]">
                    {formatMoney(c.earnedCents)}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    if (confirm("Delete this client?")) {
                      startTransition(() => deleteClient(c.id));
                    }
                  }}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label="Delete client"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function NewClientDialog() {
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      await createClient(fd);
      (e.target as HTMLFormElement).reset();
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="gold">
          <Plus className="h-4 w-4" /> New client
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New client</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="mb-1 block text-xs">Name</Label>
            <Input name="name" required autoFocus />
          </div>
          <div>
            <Label className="mb-1 block text-xs">Email (optional)</Label>
            <Input name="email" type="email" />
          </div>
          <div>
            <Label className="mb-1 block text-xs">Notes (optional)</Label>
            <Textarea name="notes" rows={3} placeholder="Contact info, preferences, invoice details…" />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" variant="gold" disabled={pending}>
              {pending ? "Saving…" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

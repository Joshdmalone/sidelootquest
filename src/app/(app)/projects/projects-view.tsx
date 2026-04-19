"use client";

import * as React from "react";
import { Plus, Trash2, FolderKanban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { createProject, deleteProject } from "../actions";

type Project = {
  id: string;
  name: string;
  color: string;
  client: { id: string; name: string } | null;
  _count: { tasks: number };
};
type Client = { id: string; name: string };

const COLORS = ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#14b8a6"];

export function ProjectsView({
  projects,
  clients,
}: {
  projects: Project[];
  clients: Client[];
}) {
  const [pending, startTransition] = React.useTransition();

  return (
    <div className="mx-auto max-w-4xl p-6 md:p-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground">Group tasks by project or gig.</p>
        </div>
        <NewProjectDialog clients={clients} />
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center">
            <FolderKanban className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No projects yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {projects.map((p) => (
            <Card key={p.id}>
              <CardContent className="flex items-center justify-between gap-3 p-4">
                <div className="flex items-center gap-3">
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ background: p.color }}
                  />
                  <div>
                    <p className="font-medium">{p.name}</p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{p._count.tasks} tasks</span>
                      {p.client && <Badge variant="secondary">{p.client.name}</Badge>}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    if (confirm("Delete this project? (Tasks stay, just become unassigned.)")) {
                      startTransition(() => deleteProject(p.id));
                    }
                  }}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label="Delete project"
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

function NewProjectDialog({ clients }: { clients: Client[] }) {
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [color, setColor] = React.useState(COLORS[0]);
  const [clientId, setClientId] = React.useState("");
  const [pending, startTransition] = React.useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("color", color);
    if (clientId) fd.set("clientId", clientId);
    startTransition(async () => {
      await createProject(fd);
      setName("");
      setClientId("");
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="gold">
          <Plus className="h-4 w-4" /> New project
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New project</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="mb-1 block text-xs">Name</Label>
            <Input name="name" value={name} onChange={(e) => setName(e.target.value)} autoFocus required />
          </div>
          <div>
            <Label className="mb-2 block text-xs">Color</Label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  className="h-8 w-8 rounded-full ring-offset-background transition-all"
                  style={{
                    background: c,
                    outline: c === color ? `2px solid ${c}` : "none",
                    outlineOffset: 2,
                  }}
                />
              ))}
            </div>
          </div>
          <div>
            <Label className="mb-1 block text-xs">Client (optional)</Label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger>
                <SelectValue placeholder="(none)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">(none)</SelectItem>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" variant="gold" disabled={pending || !name.trim()}>
              {pending ? "Saving…" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

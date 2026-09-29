"use client";

import { useState } from "react";
import { PencilIcon, PlusIcon, TrashIcon } from "lucide-react";
import IdentityFormDialog from "@/components/IdentityFormDialog";
import { useApp } from "@/components/shell/AppProvider";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { today } from "@/lib/date";
import { habitsForIdentity, monthlyVotes } from "@/lib/identity";
import type { Identity } from "@/types";

export default function IdentitiesSection() {
  const { state, saveIdentity, deleteIdentity } = useApp();
  const { identities, habits, logs } = state;
  const [editing, setEditing] = useState<Identity | "new" | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Identity | null>(null);

  const t = today();
  const affected = pendingDelete
    ? habitsForIdentity(habits, pendingDelete.id).length
    : 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <p className="me-auto text-xs text-muted-foreground">
          Atomic Habits: every check-in is a vote for the kind of person you want
          to become. Link habits to an identity to see the votes add up.
        </p>
        <Button size="sm" onClick={() => setEditing("new")}>
          <PlusIcon data-icon="inline-start" />
          New identity
        </Button>
      </div>

      <Card className="overflow-hidden py-0">
        <ul className="divide-y">
          {identities.map((identity) => {
            const count = habitsForIdentity(habits, identity.id).length;
            const votes = monthlyVotes(identity, habits, logs, t);
            return (
              <li
                key={identity.id}
                className="flex items-center gap-3 px-3 py-2.5"
              >
                <span
                  aria-hidden
                  className="flex size-7 shrink-0 items-center justify-center rounded-lg text-base"
                  style={{
                    backgroundColor: `color-mix(in oklch, ${identity.color} 16%, transparent)`,
                  }}
                >
                  {identity.emoji}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm">
                  I am becoming{" "}
                  <strong className="font-medium">{identity.statement}</strong>
                </span>
                <Badge variant="outline" className="hidden sm:inline-flex">
                  {votes} {votes === 1 ? "vote" : "votes"} / 30d
                </Badge>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {count} {count === 1 ? "habit" : "habits"}
                </span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Edit ${identity.statement}`}
                  onClick={() => setEditing(identity)}
                >
                  <PencilIcon />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Delete ${identity.statement}`}
                  onClick={() => setPendingDelete(identity)}
                >
                  <TrashIcon />
                </Button>
              </li>
            );
          })}
          {!identities.length && (
            <li className="py-8 text-center text-sm text-muted-foreground">
              No identities yet — start with one, like “a healthy person”.
            </li>
          )}
        </ul>
      </Card>

      {editing !== null && (
        <IdentityFormDialog
          identity={editing === "new" ? null : editing}
          onSave={(draft) => {
            saveIdentity(draft);
            setEditing(null);
          }}
          onClose={() => setEditing(null)}
        />
      )}

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(next) => {
          if (!next) setPendingDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete “{pendingDelete?.statement}”?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {affected > 0
                ? `${affected} ${
                    affected === 1 ? "habit" : "habits"
                  } will stay, but no longer count toward this identity.`
                : "No habits are linked to this identity."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep identity</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (pendingDelete) deleteIdentity(pendingDelete.id);
                setPendingDelete(null);
              }}
            >
              Delete identity
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

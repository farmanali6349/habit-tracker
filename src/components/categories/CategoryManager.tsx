"use client";

import { useState } from "react";
import { PencilIcon, PlusIcon, TrashIcon } from "lucide-react";
import CategoryFormDialog from "./CategoryFormDialog";
import CategoryIcon from "@/components/CategoryIcon";
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
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UNCATEGORIZED_ID, countHabitsInCategory } from "@/lib/categories";
import type { Category, CategoryDraft, Habit } from "@/types";

interface CategoryManagerProps {
  categories: Category[];
  habits: Habit[];
  onSave: (draft: CategoryDraft) => void;
  onDelete: (id: string) => void;
}

export default function CategoryManager({
  categories,
  habits,
  onSave,
  onDelete,
}: CategoryManagerProps) {
  const [editing, setEditing] = useState<Category | "new" | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Category | null>(null);

  const affected = pendingDelete
    ? countHabitsInCategory(habits, pendingDelete.id)
    : 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <p className="me-auto text-xs text-muted-foreground">
          Group your habits, each with its own icon and colour.
        </p>
        <Button size="sm" onClick={() => setEditing("new")}>
          <PlusIcon data-icon="inline-start" />
          New category
        </Button>
      </div>

      <Card className="overflow-hidden py-0">
        <ul className="divide-y">
          {categories.map((category) => {
            const count = countHabitsInCategory(habits, category.id);
            return (
              <li
                key={category.id}
                className="flex items-center gap-3 px-3 py-2.5"
              >
                <CategoryIcon
                  name={category.icon}
                  aria-hidden
                  className="size-4 shrink-0"
                  style={{ color: category.color }}
                />
                <span className="min-w-0 flex-1 truncate text-sm">
                  {category.name}
                </span>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {count} {count === 1 ? "habit" : "habits"}
                </span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Edit ${category.name}`}
                  onClick={() => setEditing(category)}
                >
                  <PencilIcon />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Delete ${category.name}`}
                  disabled={category.id === UNCATEGORIZED_ID}
                  onClick={() => setPendingDelete(category)}
                >
                  <TrashIcon />
                </Button>
              </li>
            );
          })}
          {!categories.length && (
            <li className="py-8 text-center text-sm text-muted-foreground">
              No categories yet.
            </li>
          )}
        </ul>
      </Card>

      {editing !== null && (
        <CategoryFormDialog
          category={editing === "new" ? null : editing}
          onSave={(draft) => {
            onSave(draft);
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
            <AlertDialogTitle>Delete “{pendingDelete?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              {affected > 0
                ? `${affected} ${
                    affected === 1 ? "habit" : "habits"
                  } will move to Uncategorized.`
                : "This category isn't used by any habit."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep category</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (pendingDelete) onDelete(pendingDelete.id);
                setPendingDelete(null);
              }}
            >
              Delete category
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

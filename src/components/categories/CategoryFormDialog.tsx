"use client";

import { useState } from "react";
import { toast } from "sonner";
import CategoryIcon from "@/components/CategoryIcon";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  CATEGORY_COLORS,
  CATEGORY_ICON_NAMES,
  DEFAULT_CATEGORY_COLOR,
  DEFAULT_CATEGORY_ICON,
} from "@/lib/categories";
import type { Category, CategoryDraft } from "@/types";

interface Draft {
  name: string;
  icon: string;
  color: string;
}

interface CategoryFormDialogProps {
  category: Category | null;
  onSave: (draft: CategoryDraft) => void;
  onClose: () => void;
}

export default function CategoryFormDialog({
  category,
  onSave,
  onClose,
}: CategoryFormDialogProps) {
  const [draft, setDraft] = useState<Draft>(() =>
    category
      ? { name: category.name, icon: category.icon, color: category.color }
      : { name: "", icon: DEFAULT_CATEGORY_ICON, color: DEFAULT_CATEGORY_COLOR },
  );

  const submit = () => {
    const name = draft.name.trim();
    if (!name) {
      toast.error("Give the category a name");
      return;
    }
    onSave({ id: category?.id, name, icon: draft.icon, color: draft.color });
    toast.success(category ? "Category updated" : "Category created");
  };

  return (
    <Dialog
      open
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{category ? "Edit category" : "New category"}</DialogTitle>
          <DialogDescription>
            {category
              ? "Rename it, or change its icon and colour."
              : "Group your habits under a name, icon and colour."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5">
          <div className="grid gap-2">
            <Label htmlFor="category-name">Name</Label>
            <Input
              id="category-name"
              autoFocus
              placeholder="Health"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === "Enter") submit();
              }}
            />
          </div>

          <div className="grid gap-2">
            <span className="text-sm font-medium">Icon</span>
            <ToggleGroup
              type="single"
              variant="outline"
              value={draft.icon}
              onValueChange={(value) => {
                if (value) setDraft({ ...draft, icon: value });
              }}
              className="flex-wrap justify-start"
            >
              {CATEGORY_ICON_NAMES.map((name) => (
                <ToggleGroupItem
                  key={name}
                  value={name}
                  size="sm"
                  aria-label={name}
                  className="size-8 p-0"
                >
                  <CategoryIcon name={name} />
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          <div className="grid gap-2">
            <span className="text-sm font-medium">Colour</span>
            <ToggleGroup
              type="single"
              variant="outline"
              value={draft.color}
              onValueChange={(value) => {
                if (value) setDraft({ ...draft, color: value });
              }}
              className="flex-wrap justify-start"
            >
              {CATEGORY_COLORS.map((color) => (
                <ToggleGroupItem
                  key={color.id}
                  value={color.value}
                  size="sm"
                  aria-label={color.label}
                  className="size-8 rounded-full p-0"
                >
                  <span
                    aria-hidden
                    className="size-4 rounded-full"
                    style={{ backgroundColor: color.value }}
                  />
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit}>
            {category ? "Save changes" : "Create category"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState } from "react";
import { toast } from "sonner";
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
import { CATEGORY_COLORS, DEFAULT_CATEGORY_COLOR } from "@/lib/categories";
import { DEFAULT_IDENTITY_EMOJI, IDENTITY_EMOJIS } from "@/lib/identity";
import type { Identity, IdentityDraft } from "@/types";

interface IdentityFormDialogProps {
  identity: Identity | null;
  onSave: (draft: IdentityDraft) => void;
  onClose: () => void;
}

export default function IdentityFormDialog({
  identity,
  onSave,
  onClose,
}: IdentityFormDialogProps) {
  const [draft, setDraft] = useState<IdentityDraft>(() =>
    identity
      ? {
          id: identity.id,
          statement: identity.statement,
          emoji: identity.emoji,
          color: identity.color,
        }
      : {
          statement: "",
          emoji: DEFAULT_IDENTITY_EMOJI,
          color: DEFAULT_CATEGORY_COLOR,
        },
  );

  const submit = () => {
    const statement = draft.statement.trim();
    if (!statement) {
      toast.error("Describe the identity, e.g. “a runner”");
      return;
    }
    onSave({ ...draft, statement });
    toast.success(identity ? "Identity updated" : "Identity created");
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
          <DialogTitle>{identity ? "Edit identity" : "New identity"}</DialogTitle>
          <DialogDescription>
            Habits are votes for the person you want to become. Complete “I am
            becoming …”.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5">
          <div className="grid gap-2">
            <Label htmlFor="identity-statement">I am becoming…</Label>
            <Input
              id="identity-statement"
              autoFocus
              placeholder="a healthy person"
              value={draft.statement}
              onChange={(e) =>
                setDraft({ ...draft, statement: e.target.value })
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") submit();
              }}
            />
          </div>

          <div className="grid gap-2">
            <span className="text-sm font-medium">Emoji</span>
            <ToggleGroup
              type="single"
              variant="outline"
              value={draft.emoji}
              onValueChange={(value) => {
                if (value) setDraft({ ...draft, emoji: value });
              }}
              className="flex-wrap justify-start"
            >
              {IDENTITY_EMOJIS.map((emoji) => (
                <ToggleGroupItem
                  key={emoji}
                  value={emoji}
                  size="sm"
                  aria-label={emoji}
                  className="size-8 p-0 text-base"
                >
                  {emoji}
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
            {identity ? "Save changes" : "Create identity"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

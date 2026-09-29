"use client";

import { useState } from "react";
import { AlertTriangleIcon, CopyIcon, DownloadIcon } from "lucide-react";
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
import { downloadBlob } from "@/lib/export";
import type { AppState } from "@/types";

const CONFIRM_WORD = "DELETE";

interface ClearDataDialogProps {
  state: AppState;
  onClear: () => void;
  onClose: () => void;
}

export default function ClearDataDialog({
  state,
  onClear,
  onClose,
}: ClearDataDialogProps) {
  const [confirm, setConfirm] = useState("");
  const ready = confirm.trim() === CONFIRM_WORD;

  const backup = () => JSON.stringify(state, null, 1);

  const copy = () =>
    navigator.clipboard.writeText(backup()).then(
      () => toast.success("Copied your data to the clipboard"),
      () => toast.error("Couldn't copy to clipboard"),
    );

  return (
    <Dialog
      open
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Clear all data?</DialogTitle>
          <DialogDescription>
            This permanently deletes every habit, category, check-in, sleep
            entry, timetable and note stored on this device. It cannot be
            undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
            <AlertTriangleIcon className="mt-0.5 size-4 shrink-0 text-destructive" />
            <p className="text-sm text-muted-foreground">
              Back up your data first — copy or download a JSON backup and store
              it somewhere safe, or you won&apos;t be able to restore it later.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={copy}>
              <CopyIcon data-icon="inline-start" />
              Copy data
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadBlob(backup(), "json")}
            >
              <DownloadIcon data-icon="inline-start" />
              Download JSON
            </Button>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="clear-confirm">
              Type{" "}
              <span className="font-mono font-semibold">{CONFIRM_WORD}</span> to
              confirm
            </Label>
            <Input
              id="clear-confirm"
              value={confirm}
              autoComplete="off"
              placeholder={CONFIRM_WORD}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={!ready}
            onClick={() => {
              onClear();
              onClose();
            }}
          >
            Delete everything
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState } from "react";
import { TrashIcon } from "lucide-react";
import { toast } from "sonner";
import ClearDataDialog from "./ClearDataDialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { downloadBlob, toCsv } from "@/lib/export";
import type { AppState, ExportKind } from "@/types";

interface ExportDialogProps {
  state: AppState;
  onImport: (state: AppState) => void;
  onClear: () => void;
  onClose: () => void;
}

export default function ExportDialog({
  state,
  onImport,
  onClear,
  onClose,
}: ExportDialogProps) {
  const [kind, setKind] = useState<ExportKind>("json");
  const [text, setText] = useState(() => JSON.stringify(state, null, 1));
  const [confirmClear, setConfirmClear] = useState(false);

  const handleTab = (value: string) => {
    const next = value as ExportKind;
    setKind(next);
    setText(next === "json" ? JSON.stringify(state, null, 1) : toCsv(state));
  };

  const copy = () =>
    navigator.clipboard.writeText(text).then(
      () => toast.success("Copied to clipboard"),
      () => toast.error("Couldn't copy to clipboard"),
    );

  const restore = () => {
    try {
      const parsed = JSON.parse(text);
      if (!parsed || !Array.isArray(parsed.habits)) {
        throw new Error("missing habits");
      }
      onImport(parsed as AppState);
      toast.success("Backup restored", {
        description: "Your habits were replaced with the imported backup.",
      });
      onClose();
    } catch {
      toast.error("That isn't a valid JSON backup");
    }
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
          <DialogTitle>Back up or restore</DialogTitle>
          <DialogDescription>
            Download a copy of your data, paste a JSON backup to restore it, or
            permanently clear everything to start fresh.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={kind} onValueChange={handleTab}>
          <TabsList>
            <TabsTrigger value="json">JSON</TabsTrigger>
            <TabsTrigger value="csv">CSV</TabsTrigger>
          </TabsList>
          <TabsContent value={kind}>
            <Textarea
              aria-label={kind === "json" ? "JSON backup" : "CSV export"}
              spellCheck={false}
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="h-56 resize-none field-sizing-fixed font-mono text-xs"
            />
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex-wrap">
          <Button
            variant="destructive"
            className="me-auto"
            onClick={() => setConfirmClear(true)}
          >
            <TrashIcon data-icon="inline-start" />
            Clear data
          </Button>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button variant="outline" onClick={copy}>
            Copy
          </Button>
          {kind === "json" && (
            <Button variant="secondary" onClick={restore}>
              Import
            </Button>
          )}
          <Button onClick={() => downloadBlob(text, kind)}>Download</Button>
        </DialogFooter>
      </DialogContent>

      {confirmClear && (
        <ClearDataDialog
          state={state}
          onClear={onClear}
          onClose={() => setConfirmClear(false)}
        />
      )}
    </Dialog>
  );
}

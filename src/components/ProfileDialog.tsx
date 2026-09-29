"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useApp } from "@/components/shell/AppProvider";
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

interface ProfileDialogProps {
  onClose: () => void;
}

export default function ProfileDialog({ onClose }: ProfileDialogProps) {
  const { state, setProfile } = useApp();
  const [displayName, setDisplayName] = useState(state.profile.displayName);
  const [partnerName, setPartnerName] = useState(state.profile.partnerName);

  const submit = () => {
    setProfile({
      displayName: displayName.trim(),
      partnerName: partnerName.trim(),
    });
    toast.success("Profile saved");
    onClose();
  };

  return (
    <Dialog
      open
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Your profile</DialogTitle>
          <DialogDescription>
            Shown in the sidebar and your shared weekly summary. Everything stays
            on this device.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="profile-name">Your name</Label>
            <Input
              id="profile-name"
              autoFocus
              placeholder="Farma"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submit();
              }}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="profile-partner">
              Accountability partner (optional)
            </Label>
            <Input
              id="profile-partner"
              placeholder="Their name"
              value={partnerName}
              onChange={(e) => setPartnerName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submit();
              }}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit}>Save profile</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

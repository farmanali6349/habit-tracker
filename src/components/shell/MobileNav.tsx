"use client";

import { useRef } from "react";
import SidebarNav from "./SidebarNav";
import SidebarProfile from "./SidebarProfile";
import SidebarQuickActions from "./SidebarQuickActions";
import SidebarStatus from "./SidebarStatus";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface MobileNavProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SWIPE_CLOSE_PX = 60;

export default function MobileNav({ open, onOpenChange }: MobileNavProps) {
  const touchX = useRef<number | null>(null);

  const close = () => onOpenChange(false);

  const handleTouchStart = (event: React.TouchEvent) => {
    touchX.current = event.touches[0]?.clientX ?? null;
  };

  const handleTouchMove = (event: React.TouchEvent) => {
    if (touchX.current === null) return;
    const dx = (event.touches[0]?.clientX ?? 0) - touchX.current;
    if (dx < -SWIPE_CLOSE_PX) {
      touchX.current = null;
      close();
    }
  };

  const handleTouchEnd = () => {
    touchX.current = null;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="w-64 gap-0 p-0 md:hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <SheetHeader className="border-b p-3">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarProfile />
        </SheetHeader>

        <SidebarNav onNavigate={close} />

        <div className="space-y-2 border-t p-2">
          <SidebarStatus />
          <SidebarQuickActions />
        </div>
      </SheetContent>
    </Sheet>
  );
}

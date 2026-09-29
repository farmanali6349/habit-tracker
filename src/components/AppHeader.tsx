"use client";

import { MenuIcon, SparklesIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import { useApp } from "./shell/AppProvider";
import LiveClock from "./shell/LiveClock";
import ThemeToggle from "./ThemeToggle";
import { Button } from "@/components/ui/button";
import { navItemFor } from "@/lib/nav";

interface AppHeaderProps {
  onOpenNav: () => void;
}

export default function AppHeader({ onOpenNav }: AppHeaderProps) {
  const { openOnboarding } = useApp();
  const pathname = usePathname();
  const current = navItemFor(pathname);

  return (
    <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3">
        <Button
          variant="ghost"
          size="icon-sm"
          className="md:hidden"
          aria-label="Open navigation"
          onClick={onOpenNav}
        >
          <MenuIcon />
        </Button>

        <div className="me-auto min-w-0">
          <h1 className="truncate font-heading text-sm font-medium">
            {current?.label ?? "Habit Tracker"}
          </h1>
          <p className="truncate text-xs text-muted-foreground">
            <LiveClock />
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={openOnboarding}
            aria-label="Run setup"
          >
            <SparklesIcon data-icon="inline-start" />
            <span className="hidden sm:inline">Setup</span>
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

"use client";

import { useState } from "react";
import AppHeader from "@/components/AppHeader";
import AppSidebar from "./AppSidebar";
import MobileNav from "./MobileNav";
import { useSidebar } from "@/hooks/useSidebar";
import { cn } from "@/lib/utils";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [navOpen, setNavOpen] = useState(false);
  const { collapsed } = useSidebar();

  return (
    <div className="min-h-dvh">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-3 focus:rounded-lg focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
      >
        Skip to content
      </a>

      <AppSidebar />

      <div
        className={cn(
          "flex min-h-dvh flex-col transition-[padding] duration-300 ease-out motion-reduce:transition-none",
          collapsed ? "md:pl-16" : "md:pl-60",
        )}
      >
        <AppHeader onOpenNav={() => setNavOpen(true)} />
        <MobileNav open={navOpen} onOpenChange={setNavOpen} />
        <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
          {children}
        </main>
      </div>
    </div>
  );
}

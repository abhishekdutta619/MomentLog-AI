"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { SidebarNav } from "./sidebar-nav";
import { Button } from "./ui/button";

export function AppShell({
  children,
  userLabel,
  signOutAction,
}: {
  children: React.ReactNode;
  userLabel: string;
  signOutAction: () => Promise<void>;
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar — hidden below md, quiet by design (no icons-only
          collapsed state, no badges/counts cluttering the nav). */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border px-4 py-6 md:flex">
        <span className="mb-8 px-3 text-lg font-semibold text-foreground">
          MomentLog
        </span>
        <SidebarNav />
        <div className="mt-auto pt-6">
          <p className="truncate px-3 text-xs text-muted-foreground">{userLabel}</p>
          <form action={signOutAction}>
            <Button type="submit" variant="ghost" className="mt-1 w-full justify-start px-3">
              Sign out
            </Button>
          </form>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        {/* Mobile top bar — only rendered while the nav overlay is closed.
            Having both the trigger and the overlay mounted at once is
            redundant (two "open the menu" affordances for one action), and
            it sidesteps relying on z-index alone to keep the trigger from
            showing through the backdrop. */}
        {!mobileNavOpen && (
          <div className="flex items-center justify-between border-b border-border px-4 py-3 md:hidden">
            <span className="text-lg font-semibold text-foreground">MomentLog</span>
            <button
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open menu"
              className="rounded-md p-2 text-foreground hover:bg-muted"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Mobile nav overlay */}
        {mobileNavOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            <div className="flex w-64 flex-col bg-background px-4 py-6">
              <div className="mb-8 flex items-center justify-between px-3">
                <span className="text-lg font-semibold text-foreground">MomentLog</span>
                <button
                  onClick={() => setMobileNavOpen(false)}
                  aria-label="Close menu"
                  className="rounded-md p-2 text-foreground hover:bg-muted"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <SidebarNav onNavigate={() => setMobileNavOpen(false)} />
              <div className="mt-auto pt-6">
                <p className="truncate px-3 text-xs text-muted-foreground">{userLabel}</p>
                <form action={signOutAction}>
                  <Button type="submit" variant="ghost" className="mt-1 w-full justify-start px-3">
                    Sign out
                  </Button>
                </form>
              </div>
            </div>
            {/* Tap outside to close */}
            <div className="flex-1 bg-foreground/20" onClick={() => setMobileNavOpen(false)} />
          </div>
        )}

        <main className="flex-1 px-6 py-8 md:px-10 md:py-10">{children}</main>
      </div>
    </div>
  );
}
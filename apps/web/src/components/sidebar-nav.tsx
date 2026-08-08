"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { primaryNavItems, aiNavItem, settingsNavItem, type NavItem } from "@/lib/nav-items";

function NavLink({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const pathname = usePathname();
  const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
        isActive
          ? "bg-muted font-medium text-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <Icon className="h-4 w-4" strokeWidth={1.75} />
      {item.label}
    </Link>
  );
}

// Shared between the desktop sidebar and the mobile slide-out nav.
// onNavigate lets the mobile version close itself after a tap.
export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1">
      {primaryNavItems.map((item) => (
        <NavLink key={item.href} item={item} onNavigate={onNavigate} />
      ))}

      <div className="my-3 border-t border-border" />
      <NavLink item={aiNavItem} onNavigate={onNavigate} />

      <div className="my-3 border-t border-border" />
      <NavLink item={settingsNavItem} onNavigate={onNavigate} />
    </nav>
  );
}

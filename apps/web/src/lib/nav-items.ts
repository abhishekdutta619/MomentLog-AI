import {
  Home,
  BookOpen,
  Calendar,
  CheckSquare,
  Target,
  Sparkles,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

// Matches the brand doc's nav structure: primary items, then a divider,
// then Ask MomentLog, then a divider, then Settings.
export const primaryNavItems: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/moments", label: "Moments", icon: BookOpen },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/goals", label: "Goals", icon: Target },
];

export const aiNavItem: NavItem = {
  href: "/ask",
  label: "Ask MomentLog",
  icon: Sparkles,
};

export const settingsNavItem: NavItem = {
  href: "/settings",
  label: "Settings",
  icon: Settings,
};

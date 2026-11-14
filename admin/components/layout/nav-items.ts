import {
  AlertCircle,
  Bell,
  BookOpen,
  Calendar,
  CalendarRange,
  Car,
  CheckCircle2,
  Home,
  ShieldCheck,
  Star,
  User,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: typeof Home;
}

export const MAIN_NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Today", icon: Home },
  { href: "/bookings", label: "Bookings", icon: Calendar },
  { href: "/vehicles", label: "Vehicles", icon: Car },
  { href: "/notifications", label: "Alerts", icon: Bell },
];

export const SECONDARY_NAV_ITEMS: NavItem[] = [
  { href: "/schedule", label: "Schedule", icon: CalendarRange },
  { href: "/issues", label: "Issues", icon: AlertCircle },
  { href: "/reviews", label: "Reviews", icon: Star },
  { href: "/reliability", label: "Reliability", icon: ShieldCheck },
  { href: "/verification", label: "Verification", icon: CheckCircle2 },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/guide", label: "Guide", icon: BookOpen },
];

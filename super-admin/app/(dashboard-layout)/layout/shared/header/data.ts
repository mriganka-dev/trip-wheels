import {
  House,
  Settings,
  FileText,
  type LucideIcon,
} from "lucide-react";

interface SearchType {
  href: string;
  title: string;
}

const SearchLinks: SearchType[] = [
  { title: "Dashboard Overview", href: "/" },
  { title: "Publisher Verifications", href: "/verifications" },
  { title: "Vehicle Moderation", href: "/vehicles" },
  { title: "Bookings", href: "/bookings" },
  { title: "Tasks & Calls", href: "/tasks" },
  { title: "Customer Disputes", href: "/issues" },
  { title: "Destinations", href: "/destinations" },
  { title: "Users & Publishers", href: "/users" },
  { title: "Platform Analytics", href: "/analytics" },
  { title: "Business Settings", href: "/settings" },
  { title: "Watchlists & Compliance", href: "/watchlists" },
];

interface profileType {
  avatar: LucideIcon;
  title: string;
  href: string;
  badge: boolean;
  isPro?: boolean;
  external?: boolean;
}

const profileDD: profileType[] = [
  {
    avatar: House,
    title: "Operations Today",
    href: "/",
    badge: false,
  },
  {
    avatar: Settings,
    title: "Business Settings",
    href: "/settings",
    badge: false,
  },
  {
    avatar: FileText,
    title: "Audit Trail",
    href: "/audit-log",
    badge: false,
  },
];

export {
  SearchLinks,
  profileDD,
};

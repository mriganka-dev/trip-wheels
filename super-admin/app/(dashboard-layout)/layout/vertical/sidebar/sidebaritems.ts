import { uniqueId } from "lodash";
import {
  House,
  ShieldCheck,
  Package,
  Calendar,
  List,
  HelpCircle,
  Tag,
  Users,
  BarChart3,
  FileText,
  Settings,
  Receipt,
  ShieldAlert,
  type LucideIcon,
} from "lucide-react";

export interface ChildItem {
  id?: number | string;
  name: string;
  icon?: LucideIcon;
  items?: ChildItem[];
  item?: unknown;
  url?: string;
  color?: string;
  disabled?: boolean;
  subtitle?: string;
  badge?: boolean;
  badgeType?: string;
  badgeContent?: string;
  isActive?: boolean;
  external?: boolean;
  isPro?: boolean;
}

export interface MenuItem {
  heading?: string;
  name?: string;
  icon?: LucideIcon;
  id?: number | string;
  to?: string;
  item?: MenuItem[];
  items?: ChildItem[];
  url?: string;
  disabled?: boolean;
  subtitle?: string;
  badgeType?: string;
  badge?: boolean;
  badgeContent?: string;
  isActive?: boolean;
  isPro?: boolean;
}

const SidebarContent: MenuItem[] = [
  {
    heading: "Operations",
    items: [
      {
        id: uniqueId(),
        name: "Overview (Today)",
        icon: House,
        url: "/",
      },
      {
        id: uniqueId(),
        name: "Verifications",
        icon: ShieldCheck,
        url: "/verifications",
      },
      {
        id: uniqueId(),
        name: "Vehicle Moderation",
        icon: Package,
        url: "/vehicles",
      },
      {
        id: uniqueId(),
        name: "Bookings",
        icon: Calendar,
        url: "/bookings",
      },
      {
        id: uniqueId(),
        name: "Tasks & Calls",
        icon: List,
        url: "/tasks",
      },
      {
        id: uniqueId(),
        name: "Customer Disputes",
        icon: HelpCircle,
        url: "/issues",
      },
      {
        id: uniqueId(),
        name: "Watchlists & Compliance",
        icon: ShieldAlert,
        url: "/watchlists",
      },
    ],
  },
  {
    heading: "Marketplace Management",
    items: [
      {
        id: uniqueId(),
        name: "Destinations",
        icon: Tag,
        url: "/destinations",
      },
      {
        id: uniqueId(),
        name: "Users & Publishers",
        icon: Users,
        url: "/users",
      },
      {
        id: uniqueId(),
        name: "Platform Analytics",
        icon: BarChart3,
        url: "/analytics",
      },
      {
        id: uniqueId(),
        name: "Audit Logs",
        icon: FileText,
        url: "/audit-log",
      },
      {
        id: uniqueId(),
        name: "Business Settings",
        icon: Settings,
        url: "/settings",
      },
      {
        id: uniqueId(),
        name: "CSV Exports",
        icon: Receipt,
        url: "/exports",
      },
    ],
  },
];

export default SidebarContent;

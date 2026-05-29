export interface StatCardData {
  label: string;
  value: string;
  change: string;
  trend: "up" | "down" | "flat";
}

export interface ActivityData {
  id: string;
  user: string;
  action: string;
  timestamp: string;
}

export interface QuickActionData {
  id: string;
  label: string;
  icon: "user-plus" | "file-text" | "mail" | "settings";
}

export interface RevenueDataPoint {
  month: string;
  revenue: number;
}

export const stats: StatCardData[] = [
  { label: "Total Revenue", value: "$45,231", change: "+20.1%", trend: "up" },
  { label: "Subscriptions", value: "+2,350", change: "+180.1%", trend: "up" },
  { label: "Sales", value: "+12,234", change: "+19%", trend: "up" },
  { label: "Active Now", value: "+573", change: "-2.5%", trend: "down" },
];

export const revenueData: RevenueDataPoint[] = [
  { month: "Jan", revenue: 4000 },
  { month: "Feb", revenue: 3000 },
  { month: "Mar", revenue: 5000 },
  { month: "Apr", revenue: 4500 },
  { month: "May", revenue: 6000 },
  { month: "Jun", revenue: 5500 },
];

export const recentActivity: ActivityData[] = [
  {
    id: "1",
    user: "Olivia Martin",
    action: "Upgraded to Pro plan",
    timestamp: "2 min ago",
  },
  {
    id: "2",
    user: "Jackson Lee",
    action: "Submitted a support ticket",
    timestamp: "15 min ago",
  },
  {
    id: "3",
    user: "Isabella Nguyen",
    action: "Completed onboarding",
    timestamp: "1 hr ago",
  },
  {
    id: "4",
    user: "William Kim",
    action: "Exported analytics report",
    timestamp: "3 hr ago",
  },
  {
    id: "5",
    user: "Sofia Davis",
    action: "Invited 2 team members",
    timestamp: "5 hr ago",
  },
];

export const quickActions: QuickActionData[] = [
  { id: "1", label: "Add User", icon: "user-plus" },
  { id: "2", label: "Create Report", icon: "file-text" },
  { id: "3", label: "Send Invoice", icon: "mail" },
  { id: "4", label: "View Settings", icon: "settings" },
];

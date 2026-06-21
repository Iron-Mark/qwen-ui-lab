import {
  FileText,
  Mail,
  Settings,
  UserPlus,
} from "lucide-react";
import type { QuickActionData } from "../data/dashboard-data";
import { Button } from "@/components/ui/button";

interface QuickActionButtonProps {
  action: QuickActionData;
}

const ICONS = {
  "user-plus": UserPlus,
  "file-text": FileText,
  mail: Mail,
  settings: Settings,
} as const;

export function QuickActionButton({ action }: QuickActionButtonProps) {
  const Icon = ICONS[action.icon];

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="min-h-11 gap-2 border-border/80 bg-background/80 backdrop-blur-xs hover:-translate-y-0.5 hover:bg-muted/80"
    >
      <Icon className="size-4" />
      <span>{action.label}</span>
    </Button>
  );
}

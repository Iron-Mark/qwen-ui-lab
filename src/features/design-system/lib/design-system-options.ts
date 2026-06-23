import {
  Atom,
  Boxes,
  Monitor,
  Smartphone,
  Tablet,
  Waypoints,
  type LucideIcon,
} from "lucide-react";
import type { AtomicLevel } from "../data/catalog-types";

export type PreviewMode = "desktop" | "tablet" | "mobile";

export const ATOMIC_LEVELS = [
  "atom",
  "molecule",
  "organism",
] as const satisfies readonly AtomicLevel[];

export type TierOption = {
  level: AtomicLevel;
  label: string;
  Icon: LucideIcon;
};

export const TIER_OPTIONS: readonly TierOption[] = [
  { level: "atom", label: "Atom", Icon: Atom },
  { level: "molecule", label: "Molecule", Icon: Waypoints },
  { level: "organism", label: "Organism", Icon: Boxes },
];

export const TIER_META = Object.fromEntries(
  TIER_OPTIONS.map((option) => [option.level, option]),
) as Record<AtomicLevel, TierOption>;

export const LEVEL_BADGE_VARIANT: Record<
  AtomicLevel,
  "default" | "secondary" | "outline"
> = {
  atom: "default",
  molecule: "secondary",
  organism: "outline",
};

export const PREVIEW_MODE_OPTIONS: readonly {
  value: PreviewMode;
  label: string;
  Icon: LucideIcon;
}[] = [
  { value: "desktop", label: "Desktop preview", Icon: Monitor },
  { value: "tablet", label: "Tablet preview", Icon: Tablet },
  { value: "mobile", label: "Mobile preview", Icon: Smartphone },
];

export const PREVIEW_VIEWPORTS: Record<
  PreviewMode,
  {
    className: string;
    label: string;
    stageClassName: string;
  }
> = {
  desktop: {
    className: "max-w-none",
    label: "Desktop canvas",
    stageClassName: "min-h-28 p-4 sm:p-5",
  },
  tablet: {
    className: "max-w-[42rem]",
    label: "Tablet canvas",
    stageClassName: "min-h-32 p-4 sm:p-5",
  },
  mobile: {
    className: "max-w-[23rem]",
    label: "Mobile canvas",
    stageClassName: "min-h-40 p-4",
  },
};

/**
 * UI Laws reference data aligned with https://www.uilaws.com
 * (visual-design principles + component library patterns).
 *
 * Ergonomics laws (Fitts, Hick, Jakob, Miller, …) are catalogued under
 * Laws of UX — https://lawsofux.com — see src/data/lawsOfUx.ts.
 */

export const UILAWS_SITE = "https://www.uilaws.com";
export const LAWS_OF_UX_CROSSREF = "https://lawsofux.com";
export const UILAWS_COMPONENTS_URL = "https://www.uilaws.com/components";

export type UiLawId =
  | "symmetry"
  | "rule-of-thirds"
  | "white-space"
  | "color-theory"
  | "typography-hierarchy"
  | "consistency"
  | "proximity"
  | "contrast"
  | "closure"
  | "continuity"
  | "fitts"
  | "hick"
  | "jakob";

export interface UiLaw {
  id: UiLawId;
  name: string;
  summary: string;
  /** How qwen-ui-lab applies this law in product UX */
  application: string;
}

export const UI_LAWS: UiLaw[] = [
  {
    id: "fitts",
    name: "Fitts's Law",
    summary:
      "The time to acquire a target is a function of the distance to and size of the target.",
    application:
      "Header nav links and primary actions use min-h-11 touch targets; Export/Copy controls sit in predictable corners.",
  },
  {
    id: "hick",
    name: "Hick's Law",
    summary:
      "Decision time grows with the number and complexity of choices.",
    application:
      "Upload flow stages one primary CTA at a time; design-system filters collapse to level chips plus search.",
  },
  {
    id: "jakob",
    name: "Jakob's Law",
    summary:
      "Users expect your site to work like others they already know.",
    application:
      "Dashboard shell, file upload, and copy/export patterns mirror familiar SaaS admin UIs.",
  },
  {
    id: "consistency",
    name: "Consistency",
    summary:
      "Consistent elements across an interface improve usability and aesthetics.",
    application:
      "Shared card borders, focus rings, and snippet preview styling across catalog and upload results.",
  },
  {
    id: "proximity",
    name: "Proximity",
    summary: "Nearby elements are perceived as related.",
    application:
      "Stat groups, plan cards, and law badges cluster related metadata beside previews.",
  },
  {
    id: "white-space",
    name: "White Space",
    summary: "Space improves readability, focus, and visual calm.",
    application:
      "Catalog preview panes and upload split view use generous padding and section gaps.",
  },
  {
    id: "typography-hierarchy",
    name: "Typography Hierarchy",
    summary: "Size and weight guide users through content.",
    application:
      "Page titles, card headings, and usage notes use stepped type scales (3xl → xs).",
  },
  {
    id: "contrast",
    name: "Contrast",
    summary: "Distinct elements grab attention and aid memory.",
    application:
      "Accent chips for active filters, trend colors on stats, and focus-visible rings on controls.",
  },
  {
    id: "symmetry",
    name: "Symmetry",
    summary: "Symmetrical layouts read as unified wholes.",
    application:
      "Two-column catalog grid and balanced dashboard chart row.",
  },
  {
    id: "rule-of-thirds",
    name: "Rule of Thirds",
    summary: "Key elements along a 3×3 grid feel more balanced.",
    application:
      "Hero upload zone and side-by-side reference vs generated preview.",
  },
  {
    id: "color-theory",
    name: "Color Theory",
    summary: "Color evokes emotion; harmonies support brand tone.",
    application:
      "Semantic success/danger tokens for trends; theme-aware chart palettes.",
  },
  {
    id: "closure",
    name: "Closure",
    summary: "The mind completes partial shapes.",
    application:
      "Dashed upload dropzone implies a container without a heavy box fill.",
  },
  {
    id: "continuity",
    name: "Continuity",
    summary: "Aligned elements feel more related than scattered ones.",
    application:
      "Workflow banner and step labels follow a single horizontal timeline.",
  },
];

export function lawById(id: UiLawId): UiLaw | undefined {
  return UI_LAWS.find((law) => law.id === id);
}

export function lawNames(ids: UiLawId[]): string[] {
  return ids
    .map((id) => lawById(id)?.name)
    .filter((name): name is string => Boolean(name));
}

/** UILaws.com component library names (reference only; implemented locally). */
export const UILAWS_REFERENCE_COMPONENTS = [
  "Information Card",
  "Weather Widget",
  "Terminal Window",
  "Github Widget",
  "Testimonials Slider",
] as const;

/**
 * Laws of UX - canonical reference: https://lawsofux.com (Jon Yablonski).
 * Shared reference data used by analysis and design-system surfaces.
 */

export const LAWS_OF_UX_SITE = "https://lawsofux.com";
export const LAWS_OF_UX_AUTHOR = "Jon Yablonski";

export type LawOfUxId =
  | "aesthetic-usability"
  | "fitts"
  | "hick"
  | "jakob"
  | "miller"
  | "parkinson"
  | "peak-end"
  | "serial-position"
  | "tesler"
  | "von-restorff"
  | "doherty"
  | "choice-overload"
  | "cognitive-load"
  | "goal-gradient"
  | "chunking";

export type LawDemoSurface = "upload" | "dashboard" | "catalog";

export type RelatedUiLawId =
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

export interface LawOfUx {
  id: LawOfUxId;
  name: string;
  summary: string;
  /** lawsofux.com path segment (trailing slash on site) */
  slug: string;
  application: string;
  demoSurface: LawDemoSurface;
  /** Cross-link into this repo */
  inAppHref: string;
  /** Overlap with uilaws.com principles where both apply */
  relatedUiLawIds?: RelatedUiLawId[];
}

export function lawOfUxUrl(slug: string) {
  return `${LAWS_OF_UX_SITE}/${slug}/`;
}

export const LAWS_OF_UX: LawOfUx[] = [
  {
    id: "aesthetic-usability",
    name: "Aesthetic-Usability Effect",
    slug: "aesthetic-usability-effect",
    summary:
      "Users often perceive aesthetically pleasing design as design that's more usable.",
    application:
      "Teal accent tokens, rounded cards, and subtle shadows on catalog and dashboard surfaces.",
    demoSurface: "catalog",
    inAppHref: "/design-system",
    relatedUiLawIds: ["consistency", "color-theory"],
  },
  {
    id: "fitts",
    name: "Fitts's Law",
    slug: "fitts-law",
    summary:
      "The time to acquire a target is a function of the distance to and size of the target.",
    application:
      "Full-width upload dropzone, min-h-11 header links, and corner-placed Copy/Export controls.",
    demoSurface: "upload",
    inAppHref: "/",
    relatedUiLawIds: ["fitts"],
  },
  {
    id: "hick",
    name: "Hick's Law",
    slug: "hicks-law",
    summary:
      "The time it takes to make a decision increases with the number and complexity of choices.",
    application:
      "Upload flow exposes Analyze vs Generate in sequence; catalog filters use a small chip set.",
    demoSurface: "upload",
    inAppHref: "/",
    relatedUiLawIds: ["hick"],
  },
  {
    id: "jakob",
    name: "Jakob's Law",
    slug: "jakobs-law",
    summary:
      "Users spend most of their time on other sites - they expect yours to work the same way.",
    application:
      "Familiar dashboard shell, file upload, and SaaS-style nav in the header.",
    demoSurface: "dashboard",
    inAppHref: "/",
    relatedUiLawIds: ["jakob", "consistency"],
  },
  {
    id: "miller",
    name: "Miller's Law",
    slug: "millers-law",
    summary:
      "The average person can only keep 7 (plus or minus 2) items in their working memory.",
    application:
      "Plan output is capped to five sections; quick actions show a short shortcut row.",
    demoSurface: "upload",
    inAppHref: "/",
    relatedUiLawIds: ["typography-hierarchy"],
  },
  {
    id: "parkinson",
    name: "Parkinson's Law",
    slug: "parkinsons-law",
    summary:
      "Any task will inflate until all of the available time is spent.",
    application:
      "Analyze step list and progress pulses bound perceived wait time during processing.",
    demoSurface: "upload",
    inAppHref: "/",
  },
  {
    id: "peak-end",
    name: "Peak-End Rule",
    slug: "peak-end-rule",
    summary:
      "People judge an experience by its peak and its end, not the average of every moment.",
    application:
      "Success banner after analyze and toast on copy/export reinforce a strong finish.",
    demoSurface: "upload",
    inAppHref: "/",
  },
  {
    id: "serial-position",
    name: "Serial Position Effect",
    slug: "serial-position-effect",
    summary:
      "Users best remember the first and last items in a series.",
    application:
      "Workflow steps highlight Upload and Export; session history surfaces the latest entry first.",
    demoSurface: "dashboard",
    inAppHref: "/",
    relatedUiLawIds: ["continuity"],
  },
  {
    id: "tesler",
    name: "Tesler's Law",
    slug: "teslers-law",
    summary:
      "For any system there is a certain amount of complexity which cannot be reduced.",
    application:
      "Demo mode hides API complexity; live Qwen is opt-in so the default path stays simple.",
    demoSurface: "upload",
    inAppHref: "/",
  },
  {
    id: "von-restorff",
    name: "Von Restorff Effect",
    slug: "von-restorff-effect",
    summary:
      "When multiple similar objects are present, the one that differs is most likely to be remembered.",
    application:
      "Accent primary buttons and success states stand out from neutral card chrome.",
    demoSurface: "catalog",
    inAppHref: "/design-system",
    relatedUiLawIds: ["contrast"],
  },
  {
    id: "doherty",
    name: "Doherty Threshold",
    slug: "doherty-threshold",
    summary:
      "Productivity soars when computer and user interact at a pace (<400ms) where neither waits.",
    application:
      "Instant offline analyze path and optimistic UI during live requests.",
    demoSurface: "upload",
    inAppHref: "/",
  },
  {
    id: "choice-overload",
    name: "Choice Overload",
    slug: "choice-overload",
    summary:
      "People get overwhelmed when presented with too many options (paradox of choice).",
    application:
      "Design-system level filter offers four chips; variant toggles stay per-card.",
    demoSurface: "catalog",
    inAppHref: "/design-system",
    relatedUiLawIds: ["hick"],
  },
  {
    id: "cognitive-load",
    name: "Cognitive Load",
    slug: "cognitive-load",
    summary:
      "The amount of mental resources needed to understand and interact with an interface.",
    application:
      "Split view keeps reference and plan side-by-side; snippets collapse behind preview cards.",
    demoSurface: "upload",
    inAppHref: "/",
    relatedUiLawIds: ["white-space", "proximity"],
  },
  {
    id: "goal-gradient",
    name: "Goal-Gradient Effect",
    slug: "goal-gradient-effect",
    summary:
      "The tendency to approach a goal increases with proximity to the goal.",
    application:
      "Step chips advance color as Upload -> Analyze -> Generate -> Export progresses.",
    demoSurface: "upload",
    inAppHref: "/",
    relatedUiLawIds: ["continuity"],
  },
  {
    id: "chunking",
    name: "Chunking",
    slug: "chunking",
    summary:
      "Individual pieces of information are broken down and grouped into meaningful wholes.",
    application:
      "Atomic catalog tiers (atom/molecule/organism) and plan cards group related analysis.",
    demoSurface: "catalog",
    inAppHref: "/design-system",
    relatedUiLawIds: ["proximity"],
  },
];

export function lawOfUxById(id: LawOfUxId): LawOfUx | undefined {
  return LAWS_OF_UX.find((law) => law.id === id);
}

export function filterLawsOfUx(query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return LAWS_OF_UX;
  return LAWS_OF_UX.filter((law) =>
    [law.name, law.summary, law.application, law.demoSurface]
      .join(" ")
      .toLowerCase()
      .includes(normalized),
  );
}

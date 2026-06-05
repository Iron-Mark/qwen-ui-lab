export const en = {
  hero: {
    badgeDemo: "Qwen meetup demo",
    badgeOffline: "Offline-safe · instant preview",
    title: "Turn UI screenshots into scaffold-ready React",
    subtitle:
      "Turn UI screenshots into React + Tailwind scaffolds with Qwen3-VL and Qwen Code. Upload, analyze, and export in minutes—built for live presentations without touching production APIs.",
    ctaPrimary: "Try the live flow",
    ctaSecondary: "Explore design system",
    trustDemo: "Demo mode — no API key",
    trustOffline: "Runs offline for meetups",
    benefitUploadTitle: "Start from any screenshot",
    benefitUploadBody:
      "Drop PNG, JPG, SVG, or WebP—or load the built-in sample in one click.",
    benefitAnalyzeTitle: "See structure before you code",
    benefitAnalyzeBody:
      "Get layout analysis, plan cards, and a React + Tailwind scaffold you can refine.",
    benefitDesignTitle: "Polish with the design system",
    benefitDesignBody:
      "Browse atomic snippets and UX-law patterns to speed up the last mile.",
  },
} as const;

export type HeroDictionary = {
  [K in keyof (typeof en)["hero"]]: string;
};

export type Dictionary = {
  hero: HeroDictionary;
};

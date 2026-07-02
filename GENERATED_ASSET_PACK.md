# Generated Asset Pack

This file collects generated replacement candidates created from the final `QUI` violet hex-badge style references supplied by the user.

The brand icons, social previews, and docs comparison graphic from this pack were wired into the app/docs. The actual sample references still use the repository's deterministic SVG sources under `public/references/`, restyled to the final violet `QUI` direction and rasterized through `npm run generate:reference-rasters`. A second AI-generated sample-reference candidate set now lives under `public/generated-assets/references/` for review only; it is not wired into runtime sample selection.

## Style Source

Reference images used as inspiration:

- User-supplied `QUI` violet hex-badge style references.

Core style: glossy 3D purple `QUI` hexagonal badge, deep indigo background, beveled violet and lavender surfaces, neon purple rim lighting, brand violet as the primary theme, blue as the secondary/info/positive accent, red only for risk/error/negative states, premium AI developer-tool tone.

## Ready-To-Use Candidates

| Audit ID | Purpose | Ready file | Dimensions |
|---|---|---|---|
| A001-A005 | Master app icon | `public/generated-assets/brand/qwen-ui-lab-app-icon-master.png` | 1254x1254 |
| A001-A004 | PWA icon candidate | `public/generated-assets/brand/qwen-ui-lab-app-icon-512.png` | 512x512 |
| A001-A004 | PWA icon candidate | `public/generated-assets/brand/qwen-ui-lab-app-icon-192.png` | 192x192 |
| A005 | Apple touch icon candidate | `public/generated-assets/brand/qwen-ui-lab-apple-touch-icon-180.png` | 180x180 |
| A001 | Favicon PNG candidate | `public/generated-assets/brand/qwen-ui-lab-favicon-64.png` | 64x64 |
| A021 | Home social preview | `public/generated-assets/social/home-social-preview-1200x630.png` | 1200x630 |
| A022 | Design system social preview | `public/generated-assets/social/design-system-social-preview-1200x630.png` | 1200x630 |
| A023 | Laws of UX social preview | `public/generated-assets/social/laws-of-ux-social-preview-1200x630.png` | 1200x630 |
| A024 | UILaws social preview | `public/generated-assets/social/uilaws-social-preview-1200x630.png` | 1200x630 |
| A015 | Before/after docs graphic | `public/generated-assets/docs/before-after-comparison-1600x900.png` | 1600x900 |
| A030 | Abstract brand background | `public/generated-assets/backgrounds/qwen-ui-lab-abstract-background-2400x1350.png` | 2400x1350 |
| A007 | Dashboard reference candidate | `public/generated-assets/references/dashboard-reference-candidate-1440x900.png` | 1440x900 |
| A008 | Auth reference candidate | `public/generated-assets/references/auth-reference-candidate-1200x720.png` | 1200x720 |
| A009 | Mobile reference candidate | `public/generated-assets/references/mobile-reference-candidate-390x844.png` | 390x844 |
| A010 | Landing reference candidate | `public/generated-assets/references/landing-reference-candidate-1440x900.png` | 1440x900 |
| A011 | Settings reference candidate | `public/generated-assets/references/settings-reference-candidate-1200x720.png` | 1200x720 |
| A012 | Ecommerce reference candidate | `public/generated-assets/references/ecommerce-reference-candidate-1200x720.png` | 1200x720 |
| A013 | Dense dashboard stress candidate | `public/generated-assets/references/stress-dashboard-reference-candidate-1440x900.png` | 1440x900 |
| A014 | Repeated list stress candidate | `public/generated-assets/references/stress-list-reference-candidate-1200x720.png` | 1200x720 |

## Wired Files

| Area | Active file or reference | Source |
|---|---|---|
| Header/footer brand image | `/icons/icon-512.png` | Generated app icon master |
| PWA PNG icons | `public/icons/icon-192.png`, `public/icons/icon-512.png`, `public/icons/icon-maskable-512.png`, `public/icons/apple-touch-icon.png` | Generated app icon master |
| Browser favicon | `src/app/favicon.ico` | Generated app icon master |
| Home social metadata | `/social/home-social-preview-1200x630.png` | Promoted copy of generated social preview |
| Design-system social metadata | `/social/design-system-social-preview-1200x630.png` | Promoted copy of generated social preview |
| Laws of UX social metadata | `/social/laws-of-ux-social-preview-1200x630.png` | Promoted copy of generated social preview |
| UILaws social metadata | `/social/uilaws-social-preview-1200x630.png` | Promoted copy of generated social preview |
| Documentation before/after graphic | `docs/media/before-after-comparison.png` | Generated docs comparison graphic |
| Sample references | `public/references/*.svg`, `*.png`, `*.webp` | Source-based restyle, not AI screenshot renders |

## Raw Generator Renders

The first render files were also copied into the same folders without exact-size suffixes. These preserve the original image-generator canvas before resizing:

- `public/generated-assets/social/*.png` without `-1200x630`
- `public/generated-assets/references/*-generated.png`
- `public/generated-assets/docs/before-after-comparison-generated.png`
- `public/generated-assets/backgrounds/qwen-ui-lab-abstract-background.png`

The web-facing social card files are promoted copies in `public/social/`; the `public/generated-assets/social/` files remain as the replacement-pack archive.

Original untouched generator outputs remain outside the repository and are intentionally not referenced here.

## Usage Notes

- The ready files are exact-size PNG candidates for the audited slots.
- Active reference sample replacements are source-based: use `public/references/*.svg`, `*.png`, and `*.webp`.
- AI-generated reference sample files under `public/generated-assets/references/` are candidate review images only. Do not wire them into the analyzer/sample picker without a separate visual and test review.
- The social previews include embedded text and should be visually checked before replacing generated OG routes.
- The app icons are opaque rounded-square icon candidates. A true transparent cutout logo was not generated in this pass.
- The first AI-generated reference screenshots were removed because they looked too artificial for the sample picker/analyzer workflow. The current A007-A014 candidates were regenerated with more source-like UI screenshot prompts and kept separate from active app assets.

## Final QA

Completed on 2026-07-03:

- Removed rejected fake reference screenshot drafts from `public/generated-assets/references`.
- Regenerated A007-A014 reference screenshot candidates with imagegen and saved exact-size review copies under `public/generated-assets/references/`.
- Refined the reference-candidate palette so violet is primary, blue is secondary/supportive, and red is the only risk/negative color.
- Confirmed active sample references are the source-based `public/references/*.svg`, `*.png`, and `*.webp` files.
- Confirmed generated social previews, app icon PNGs, favicon, and docs before/after graphic exist at their wired locations.
- Captured browser QA screenshots under `.local-logs/asset-qa/`.
- Passed `npm run validate:assets`.
- Passed `npm run validate:docs`.
- Passed `npm test`.
- Passed `npm run lint`.
- Passed `npm run build`.
- Passed `npm run test:e2e:pr-smoke` against the existing local server on port 3001.

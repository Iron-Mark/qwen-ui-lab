# AI Image Brand Guide

Use this guide as the reusable context block when generating replacement images for this repository. It is designed to keep every generated asset visually consistent across separate conversations.

## Repository Context

`qwen-ui-lab` is a developer-focused web app that turns UI screenshots into reviewable React + Tailwind starter packages. The product experience centers on uploading a screenshot, detecting UI structure, reviewing editable regions, and exporting reviewable starter files.

The visual system should feel like a practical frontend engineering tool: clear, precise, calm, and polished. It should look useful before it looks decorative.

## Brand Positioning

**Product category:** Developer tool, AI-assisted UI analysis, screenshot-to-code workflow, design system playground.

**Audience:** Frontend engineers, product engineers, UI designers, design-system maintainers, startup builders, and technical product teams.

**Personality:** Clear, reliable, intelligent, practical, modern, quietly premium.

**Core visual metaphor:** A glossy violet hexagonal product badge with bold `QUI` lettering, beveled shield geometry, orbiting screenshot-analysis arcs, and a dark technical core.

**Final logo reference:** Use the approved glossy purple `QUI` hexagonal badge source from the project asset handoff. Do not commit workstation-local file paths into prompts or documentation.

**Current installed assets:** App/PWA icons, favicon, social preview PNGs, and the docs before/after image now use the final violet `QUI` brand direction. Sample reference screenshots are source-based assets in `public/references` and should be restyled through SVG/raster regeneration, not replaced with fake AI-rendered screenshot art.

**Avoid:** Generic AI magic, stock-photo people, cartoon mascots, cyberpunk noise, copied platform logos, and unrelated abstract art. Purple/violet is now the brand anchor, but supporting assets should still feel controlled, readable, and product-focused.

## Visual Identity

### Final Logo Style

The final logo style is a premium 3D badge:

- Hexagonal shield silhouette.
- Dark indigo/near-black inner face.
- Glossy beveled violet frame pieces.
- Bold extruded `QUI` lettering in lavender-to-electric-purple material.
- Bright rim lighting and small neon edge highlights.
- Curved orbital swooshes that suggest motion, analysis, and UI transformation.
- Transparent-background master treatment, with enough shadow/depth to sit on light or dark surfaces.

Use this as the anchor for all future generated assets. Other images do not need to literally repeat the logo, but they should echo its materials: dark technical base, violet/lavender glow, beveled precision, and controlled premium depth.

### Overall Style

- Premium developer-tool SaaS.
- UI-first and product-oriented.
- Crisp vector-like detail.
- Clean dashboard, form, card, chart, and component compositions.
- Realistic app screenshots rather than fantasy interfaces.
- Subtle depth through borders, shadows, restrained gradients, and occasional beveled purple brand accents.

### Mood

- Calm and capable.
- Technical but approachable.
- Focused and reviewable.
- Premium and luminous without becoming noisy.

### Shape Language

- Hexagonal badge and shield geometry for brand assets.
- Beveled plates, faceted edges, and subtle extrusion for logo/social hero graphics.
- Curved orbital arcs or analysis swooshes as secondary brand motion motifs.
- Rounded rectangles with modest radii.
- Clean UI cards and panels.
- Thin dividers and soft borders.
- Grid-aligned layouts.
- Simple abstract symbols for analysis, screenshots, code, and export.

## Color System

Use this as the default palette for generated assets.

| Role | Color | Notes |
|---|---|---|
| Light background | `#FAFAFA` | Main neutral background |
| White surface | `#FFFFFF` | Cards, panels, forms |
| Deep indigo | `#08061F` | Final logo core and premium dark surfaces |
| Dark background | `#0B1020` | Social cards, hero depth, icon background |
| Charcoal | `#18181B` | Dark UI surfaces |
| Primary text | `#18181B` | Light mode text |
| Muted text | `#71717A` | Secondary labels |
| Border | `#E4E4E7` | Subtle UI borders |
| Primary brand violet | `#7C3AED` | Main brand accent and logo material |
| Electric violet | `#8B5CF6` | Glow, bevel edges, active emphasis |
| Lavender highlight | `#C4B5FD` | Logo shine and soft highlights |
| Support blue | `#2563EB` | Secondary/info/positive accent |
| Signal red | `#DC2626` | Error, risk, blocked, or negative trend accent |

### Palette Rules

- Use neutral UI surfaces as the foundation.
- Use violet/lavender as the primary brand accent, especially in logos, social images, hero accents, and premium highlights.
- Use blue as the only secondary accent for info, positive, analysis, and supporting details.
- Use red only for risk, blocked, error, or negative states.
- Keep UI screenshots mostly neutral with selective purple brand chrome; do not flood every screen with purple.
- Avoid green, mint, cyan, teal, yellow, amber, beige, brown, orange-heavy, or unrelated one-note palettes as theme accents.
- Keep status colors functional, not decorative.
- Prefer high contrast over atmospheric blending.

## Typography Direction

Generated images should avoid relying on exact text whenever possible. If text is needed:

- Use short, simple UI labels.
- Keep headings large and readable.
- Use neutral modern sans-serif typography.
- Do not generate dense paragraphs.
- Do not generate legal, financial, personal, or brand-sensitive text.
- Avoid tiny microcopy that may become garbled.

Recommended text style:

- Headings: bold, clean, product UI style.
- Labels: compact, medium weight.
- Body copy: sparse and secondary.
- Code snippets: short, decorative, not meant to be copied.

## Logo and Icon Direction

The replacement logo family should be original and consistent.

### Preferred Logo Concept

Use the final logo reference as the master style: a glossy 3D hexagonal `QUI` badge. When describing or generating logo variants, ask for:

- Hexagonal shield badge silhouette.
- Dark indigo inner face.
- Purple and lavender beveled frame segments.
- Bold extruded `QUI` lettering.
- Neon violet rim highlights.
- Curved orbital arcs/swooshes that imply screenshot analysis and transformation.
- Transparent-background master export.

For very small app icons, simplify the badge while preserving the hex silhouette, `QUI` letter mass, dark core, and violet/lavender bevel identity.

### Icon Style

- SVG-ready.
- Geometric.
- Strong silhouette at small sizes.
- High contrast.
- The full `QUI` letterform is acceptable for medium and large logo assets; use a simplified monogram or symbol for tiny favicon sizes.
- No brand imitation.

### App Icon Requirements

Generate the app icon family as one matching set:

- Favicon.
- SVG app icon.
- 192x192 PNG.
- 512x512 PNG.
- 512x512 maskable icon.
- 180x180 Apple touch icon.

The icon must remain legible at 16 px and must fit safely inside maskable icon crop zones.

## Screenshot Asset Direction

The repository uses sample UI screenshots as product inputs. Replacement screenshots should look like real UI screens, not marketing illustrations.

### Shared Screenshot Rules

- Preserve the original dimensions unless the code is updated.
- Show a complete app viewport.
- Use clean, inspectable UI hierarchy.
- Make cards, forms, buttons, nav, and charts easy to identify.
- Keep layouts grid-aligned.
- Avoid real company names, real people, real product photos, or private data.
- Use generic sample names only if needed.
- Avoid dense text that an image model may garble.

### Required Sample Types

Generate these as a matching set:

| Sample | Target Size | Purpose |
|---|---:|---|
| Dashboard | 1440x900 | Hero background, sample picker, PWA wide screenshot |
| Auth | 1200x720 | Sign-in form sample |
| Mobile app | 390x844 | Portrait mobile sample, PWA narrow screenshot |
| Landing page | 1440x900 | Marketing page sample |
| Settings | 1200x720 | Account/preferences UI sample |
| Ecommerce | 1200x720 | Product catalog sample |
| Dense dashboard | 1440x900 | Stress test for charts, tables, metrics |
| Repeated list | 1200x720 | Stress test for rows, actions, and list rhythm |

## Social Preview Direction

Social preview images should be generated as a matching family.

Target size: 1200x630.

Recommended layout:

- Dark navy or charcoal background.
- Deep indigo background with violet/lavender rim light.
- Optional subtle blue grid or scan motif as a secondary detail.
- Abstract screenshot-analysis panel.
- Small or medium final-logo badge placement.
- Safe area for title and subtitle.
- Violet/lavender primary accent.
- Blue secondary analysis accent; red only for risk/error details.
- Minimal UI/code elements.

Social cards should not depend on exact generated text. Prefer editable text areas or manually added final text later.

## Asset-Specific Consistency Rules

### App Icons

- Use the same master mark across all sizes.
- Avoid tiny text.
- Avoid real or copied logos.
- Test at 16 px, 32 px, 180 px, 192 px, and 512 px.

### Reference Screenshots

- Generate all eight samples with one visual system.
- Keep consistent card radius, font scale, spacing, and accent colors.
- Each screen should be clearly different in layout archetype.
- Do not use the same generic dashboard composition for every sample.

### Social Images

- Use a common brand background structure.
- Change only the accent emphasis per route.
- Keep headline-safe space.
- Avoid clutter behind text.

### Documentation Graphics

- Use clean editorial diagrams.
- Keep text manually editable when possible.
- Avoid baked-in emoji or encoding-sensitive characters.

## Global Positive Prompt

Use this at the top of image-generation requests:

```text
Use the final qwen-ui-lab logo direction as the brand anchor: a glossy 3D hexagonal shield badge with a dark indigo core, beveled violet/lavender frame, bold extruded QUI lettering, neon purple rim highlights, and curved orbital analysis swooshes. For supporting assets, preserve the same premium developer-tool feel: clean, precise, calm, technical, and polished. Use neutral UI surfaces, deep navy/charcoal contrast, violet/lavender as the primary brand theme, blue as the only secondary/info/positive accent, and red only for risk/error/negative states. Favor crisp UI detail, realistic product screenshots, clear grid alignment, modest rounded corners, readable hierarchy, high contrast, and controlled luminous depth. Avoid green, mint, cyan, teal, yellow, and amber theme accents.
```

## Global Negative Prompt

Use this in every request:

```text
Avoid copied brand logos, Qwen logo imitation beyond the provided final QUI badge direction, Next.js logo, Vercel triangle, GitHub Octocat, LinkedIn logo, Google logo, copyrighted characters, living artist imitation, stock-photo people, watermarks, garbled text, tiny unreadable microcopy, random code gibberish, cyberpunk noise, mascot art, flat one-note purple washes, green/mint/cyan/teal/yellow/amber theme accents, beige/brown/orange-heavy palette, decorative blobs, bokeh orbs, cluttered UI, broken alignment, low contrast, cropped interface, device hands, and photorealistic office scenes.
```

## Reusable Prompt Template

```text
Use the qwen-ui-lab brand guide.

Asset purpose:
[WHAT THIS IMAGE WILL BE USED FOR]

Asset type:
[APP ICON / UI SCREENSHOT / SOCIAL PREVIEW / DOCUMENTATION GRAPHIC / ICON]

Subject:
[MAIN SUBJECT OR SCREEN TYPE]

Required dimensions:
[WIDTH x HEIGHT]

Composition:
[LAYOUT REQUIREMENTS]

Style:
Premium developer-tool SaaS, clean UI-first design, crisp vector-like detail, realistic product interface, calm technical mood.

Color:
Neutral white/zinc UI foundation, deep indigo or charcoal contrast, violet/lavender primary brand accents from the final QUI badge, blue secondary/info/positive accents, and red only for risk/error/negative states. Avoid green, mint, cyan, teal, yellow, and amber as theme accents.

Functional constraints:
[SAFE AREA, TRANSPARENCY, MASKABLE ICON SAFE ZONE, TEXT AREA, NO TEXT, ETC.]

Output:
[PNG / SVG / WEBP / ICO SOURCE]

Negative prompt:
Avoid copied brand logos, Qwen logo imitation beyond the provided final QUI badge direction, Next.js logo, Vercel triangle, GitHub Octocat, LinkedIn logo, Google logo, copyrighted characters, living artist imitation, stock-photo people, watermarks, garbled text, tiny unreadable microcopy, random code gibberish, cyberpunk noise, mascot art, flat one-note purple washes, beige/brown/orange-heavy palette, decorative blobs, bokeh orbs, cluttered UI, broken alignment, low contrast, cropped interface, device hands, and photorealistic office scenes.
```

## First Batch Recommendation

Generate assets in this order:

1. App icon master mark and icon family.
2. Dashboard reference sample.
3. Remaining seven reference samples as a matching screenshot suite.
4. Social preview image family.
5. Documentation comparison graphic.
6. Optional cleanup replacements for unused starter SVGs.

The app icon master and dashboard reference should define the rest of the system.

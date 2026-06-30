# AI Image Brand Guide

Use this guide as the reusable context block when generating replacement images for this repository. It is designed to keep every generated asset visually consistent across separate conversations.

## Repository Context

`qwen-ui-lab` is a developer-focused web app that turns UI screenshots into reviewable React + Tailwind starter packages. The product experience centers on uploading a screenshot, detecting UI structure, reviewing editable regions, and exporting reviewable starter files.

The visual system should feel like a practical frontend engineering tool: clear, precise, calm, and polished. It should look useful before it looks decorative.

## Brand Positioning

**Product category:** Developer tool, AI-assisted UI analysis, screenshot-to-code workflow, design system playground.

**Audience:** Frontend engineers, product engineers, UI designers, design-system maintainers, startup builders, and technical product teams.

**Personality:** Clear, reliable, intelligent, practical, modern, quietly premium.

**Core visual metaphor:** Screenshot frame plus AI analysis lens plus code/export structure.

**Avoid:** Generic AI magic, stock-photo people, cartoon mascots, cyberpunk noise, copied platform logos, and overly decorative abstract art.

## Visual Identity

### Overall Style

- Premium developer-tool SaaS.
- UI-first and product-oriented.
- Crisp vector-like detail.
- Clean dashboard, form, card, chart, and component compositions.
- Realistic app screenshots rather than fantasy interfaces.
- Subtle depth through borders, shadows, and restrained gradients.

### Mood

- Calm and capable.
- Technical but approachable.
- Focused and reviewable.
- Modern without feeling flashy.

### Shape Language

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
| Dark background | `#0B1020` | Social cards, hero depth, icon background |
| Charcoal | `#18181B` | Logo background, dark UI surfaces |
| Primary text | `#18181B` | Light mode text |
| Muted text | `#71717A` | Secondary labels |
| Border | `#E4E4E7` | Subtle UI borders |
| Primary accent | `#22D3EE` | Cyan, analysis frame, focus highlight |
| Secondary accent | `#10B981` | Mint/green, success and progress |
| Soft violet | `#A78BFA` | AI/analysis accent |
| Positive | `#059669` | Success trends |
| Negative | `#DC2626` | Error or negative trends |
| Warning | `#F59E0B` | Warning state |

### Palette Rules

- Use neutral UI surfaces as the foundation.
- Use cyan/mint as the primary brand accent.
- Use violet only as a secondary AI/analysis accent.
- Do not make the whole image purple, blue, beige, orange, or brown.
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

An abstract mark combining:

- A screenshot or browser-frame outline.
- A detection lens or analysis ring.
- Three ascending code/data bars.
- Optional subtle grid or scan-line motif.

### Icon Style

- SVG-ready.
- Geometric.
- Strong silhouette at small sizes.
- High contrast.
- No text inside small icons.
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
- Subtle cyan grid or scan motif.
- Abstract screenshot-analysis panel.
- Safe area for title and subtitle.
- Cyan/mint primary accent.
- Violet secondary accent.
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
Create an original visual asset for qwen-ui-lab, a developer tool that turns UI screenshots into reviewable React + Tailwind starter packages. The visual identity should feel like a premium but practical frontend engineering SaaS product: clean, precise, calm, technical, and polished. Use neutral UI surfaces, dark navy or charcoal contrast, cyan/mint primary accents, and subtle violet AI-analysis accents. Favor crisp vector-like UI detail, realistic product screenshots, clear grid alignment, modest rounded corners, readable hierarchy, and high contrast. The core visual metaphor is a screenshot frame plus AI analysis lens plus code/export structure.
```

## Global Negative Prompt

Use this in every request:

```text
Avoid copied brand logos, Qwen logo imitation, Next.js logo, Vercel triangle, GitHub Octocat, LinkedIn logo, Google logo, copyrighted characters, living artist imitation, stock-photo people, watermarks, garbled text, tiny unreadable microcopy, random code gibberish, cyberpunk noise, mascot art, excessive purple gradients, beige/brown/orange-heavy palette, decorative blobs, bokeh orbs, cluttered UI, broken alignment, low contrast, cropped interface, device hands, and photorealistic office scenes.
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
Neutral white/zinc UI foundation, dark navy or charcoal contrast, cyan/mint primary accents, subtle violet AI-analysis accents.

Functional constraints:
[SAFE AREA, TRANSPARENCY, MASKABLE ICON SAFE ZONE, TEXT AREA, NO TEXT, ETC.]

Output:
[PNG / SVG / WEBP / ICO SOURCE]

Negative prompt:
Avoid copied brand logos, Qwen logo imitation, Next.js logo, Vercel triangle, GitHub Octocat, LinkedIn logo, Google logo, copyrighted characters, living artist imitation, stock-photo people, watermarks, garbled text, tiny unreadable microcopy, random code gibberish, cyberpunk noise, mascot art, excessive purple gradients, beige/brown/orange-heavy palette, decorative blobs, bokeh orbs, cluttered UI, broken alignment, low contrast, cropped interface, device hands, and photorealistic office scenes.
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

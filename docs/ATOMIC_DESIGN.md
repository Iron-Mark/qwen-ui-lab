# Atomic design code principles (qwen-ui-lab)

This project follows [atomic design](https://bradfrost.com/blog/post/atomic-web-design/) in **both** the component folder structure and the design-system catalog.

## Folder structure

```
src/components/
  ui/              # shadcn/ui primitives (CLI-managed — Button, Card, Badge, …)
  atoms/           # Single-purpose UI built from ui/ primitives
  molecules/       # Composed widgets (atoms + ui/)
  organisms/       # Dashboard sections & flows (atoms + molecules)
  design-system/   # Catalog chrome (preview cards, sections — not product UI)
  providers/       # Theme, toast, error boundary (infrastructure)
  charts/          # Re-exports chart molecules for convenience
```

## shadcn/ui (`ui/`)

- Installed via [shadcn/ui](https://ui.shadcn.com) CLI (`components.json` at repo root).
- **Do not edit by hand** except for project-specific tweaks — prefer `npx shadcn@latest add <component>` to update.
- Design tokens live in `src/app/globals.css` (`--primary`, `--radius`, app-specific `--success`, `--chart-*`, etc.).
- Atoms and molecules **compose** `@/components/ui/*` — they do not duplicate button/card markup.

```tsx
// Preferred inside atoms
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
```

Global toasts use **Sonner** (`@/components/ui/sonner`) via the thin `useToast()` shim in `providers/Toast.tsx`.

## Tier rules

| Tier | Can import | Examples |
|------|------------|----------|
| **ui/** | utilities only | `Button`, `Card`, `Input`, `Tabs`, `Sonner` |
| **Atom** | `ui/`, utilities, providers (context only) | `ThemeToggle`, `ExportButton`, `ProviderModeBadge` |
| **Molecule** | atoms, `ui/`, data, lib | `StatCard`, `SnippetPreview`, `LawOfUxCard` |
| **Organism** | atoms, molecules, `ui/`, data, lib | `Header`, `UploadFlow`, `ChartPreview` |
| **Provider** | — (excluded from catalog) | `ThemeProvider`, `Toast`, `ErrorBoundary` |

**Do not** import organisms from atoms or molecules from organisms (one-way composition).

## Catalog domains

All registered components live in [`src/data/catalog.tsx`](../src/data/catalog.tsx):

| Domain | Purpose |
|--------|---------|
| `product` | Dashboard, upload flow, charts, shadcn primitives |
| `uilaws` | [UILaws](https://www.uilaws.com) pattern components |
| `laws-of-ux` | [Laws of UX](https://lawsofux.com) principle cards with demos |

Browse at **`/design-system`** — filter by domain (`?domain=uilaws`) or atomic level.

Legacy routes redirect:

- `/design-system/uilaws` → `/design-system?domain=uilaws`
- `/design-system/laws-of-ux` → `/design-system?domain=laws-of-ux`

## Adding a component

1. If you need a new primitive, run `npx shadcn@latest add <name>` into `src/components/ui/`.
2. Create product-specific wrappers under the correct tier folder (`atoms/`, `molecules/`, or `organisms/`).
3. Register an entry in `catalog.tsx` with:
   - `level`, `domain`, `sourcePath`
   - live `preview`, export `code` snippet, optional `props` / `variants`
4. Verify on `/design-system` (search + level/domain filters).
5. Run `npm test` and `npm run build`.

## What stays outside the catalog

- Next.js pages (`src/app/`)
- API routes (`src/app/api/`)
- Providers (`src/components/providers/`)
- Raw shadcn files under `ui/` (listed in catalog only when documenting primitives)
- Catalog meta UI (`ComponentPreviewCard`, `AtomicSection`, `DesignSystemPreview`)

## Import paths

Prefer tier-based imports for product UI; use `ui/` for shadcn primitives:

```tsx
import { Button } from "@/components/ui/button";
import { ExportButton } from "@/components/atoms/ExportButton";
import { StatCard } from "@/components/molecules/StatCard";
import { Header } from "@/components/organisms/Header";
```

Or barrel files: `@/components/atoms`, `@/components/molecules`, `@/components/organisms`.

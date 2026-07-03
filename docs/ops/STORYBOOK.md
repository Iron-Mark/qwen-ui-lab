# Storybook (deferred)

Storybook was not initialized in this pass to keep the polish bundle focused and avoid duplicate preview surfaces - the **Design system** page (`/design-system`) already provides live previews, variant toggles, copy/export, and Prism-highlighted snippets for catalog components.

To add Storybook later:

```bash
npx storybook@latest init
```

Suggested first stories: `ExportButton`, `SnippetPreview`, `ComponentPreviewCard`.

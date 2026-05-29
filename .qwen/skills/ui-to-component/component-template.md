# Component Template

Use this as a starting point for new components.

```tsx
import { cn } from "@/lib/cn";

interface ComponentNameProps {
  // Define props here
}

export function ComponentName({ /* destructure props */ }: ComponentNameProps) {
  return (
    <div>
      {/* Component content */}
    </div>
  );
}
```

## Rules

- Always use named exports (not default exports).
- Always define a typed props interface.
- Keep components under ~80 lines.
- Extract sub-components if a section grows too large.

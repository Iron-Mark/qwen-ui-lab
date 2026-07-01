const SHADCN_JSX_IMPORTS = {
  Badge: { path: "@/components/ui/badge", name: "Badge" },
  Button: { path: "@/components/ui/button", name: "Button" },
  Card: { path: "@/components/ui/card", name: "Card" },
  CardContent: { path: "@/components/ui/card", name: "CardContent" },
  CardDescription: { path: "@/components/ui/card", name: "CardDescription" },
  CardFooter: { path: "@/components/ui/card", name: "CardFooter" },
  CardHeader: { path: "@/components/ui/card", name: "CardHeader" },
  CardTitle: { path: "@/components/ui/card", name: "CardTitle" },
  Dialog: { path: "@/components/ui/dialog", name: "Dialog" },
  DialogContent: { path: "@/components/ui/dialog", name: "DialogContent" },
  DialogDescription: { path: "@/components/ui/dialog", name: "DialogDescription" },
  DialogFooter: { path: "@/components/ui/dialog", name: "DialogFooter" },
  DialogHeader: { path: "@/components/ui/dialog", name: "DialogHeader" },
  DialogTitle: { path: "@/components/ui/dialog", name: "DialogTitle" },
  Input: { path: "@/components/ui/input", name: "Input" },
  Label: { path: "@/components/ui/label", name: "Label" },
  Select: { path: "@/components/ui/select", name: "Select" },
  SelectContent: { path: "@/components/ui/select", name: "SelectContent" },
  SelectItem: { path: "@/components/ui/select", name: "SelectItem" },
  SelectTrigger: { path: "@/components/ui/select", name: "SelectTrigger" },
  SelectValue: { path: "@/components/ui/select", name: "SelectValue" },
  Table: { path: "@/components/ui/table", name: "Table" },
  TableBody: { path: "@/components/ui/table", name: "TableBody" },
  TableCell: { path: "@/components/ui/table", name: "TableCell" },
  TableHead: { path: "@/components/ui/table", name: "TableHead" },
  TableHeader: { path: "@/components/ui/table", name: "TableHeader" },
  TableRow: { path: "@/components/ui/table", name: "TableRow" },
  Tabs: { path: "@/components/ui/tabs", name: "Tabs" },
  TabsContent: { path: "@/components/ui/tabs", name: "TabsContent" },
  TabsList: { path: "@/components/ui/tabs", name: "TabsList" },
  TabsTrigger: { path: "@/components/ui/tabs", name: "TabsTrigger" },
};

export function normalizeGeneratedShadcnImports(code) {
  const source = String(code || "");
  const used = collectUsedShadcnJsx(source);
  if (!used.length) return source;

  const existingImports = collectExistingValueImports(source);
  const missingByPath = new Map();
  for (const component of used) {
    const target = SHADCN_JSX_IMPORTS[component];
    if (!target) continue;
    if (existingImports.get(target.path)?.has(target.name)) continue;

    const names = missingByPath.get(target.path) ?? new Set();
    names.add(target.name);
    missingByPath.set(target.path, names);
  }

  if (!missingByPath.size) return source;
  const merged = mergeMissingIntoExistingImports(source, missingByPath);
  if (!merged.remaining.size) return merged.source;

  const missingImports = [...merged.remaining.entries()]
    .sort(([first], [second]) => first.localeCompare(second))
    .map(([path, names]) => buildImportLine([...names].sort(), path));

  return insertAfterImportBlock(merged.source, missingImports.join("\n"));
}

function collectUsedShadcnJsx(source) {
  return [
    ...new Set(
      [...source.matchAll(/<([A-Z][A-Za-z0-9.]*)\b/g)]
        .map((match) => match[1].split(".")[0])
        .filter((tag) => SHADCN_JSX_IMPORTS[tag]),
    ),
  ].sort();
}

function collectExistingValueImports(source) {
  const imports = new Map();
  for (const match of source.matchAll(
    /^import\s+\{([\s\S]*?)\}\s+from\s+["']([^"']+)["'];?[ \t]*$/gm,
  )) {
    const path = match[2];
    const names = imports.get(path) ?? new Set();
    for (const item of parseImportSpecifiers(match[1])) {
      const [, alias] = item.split(/\s+as\s+/i).map((part) => part.trim());
      const name = alias || item.trim();
      if (name) names.add(name);
    }
    imports.set(path, names);
  }
  return imports;
}

function mergeMissingIntoExistingImports(source, missingByPath) {
  const importMatches = [...source.matchAll(
    /^import\s+\{([\s\S]*?)\}\s+from\s+["']([^"']+)["'];?[ \t]*$/gm,
  )];
  if (!importMatches.length) {
    return { source, remaining: missingByPath };
  }

  let nextSource = source;
  const remaining = new Map([...missingByPath.entries()].map(([path, names]) => [path, new Set(names)]));

  for (const match of importMatches.reverse()) {
    const path = match[2];
    const missing = remaining.get(path);
    if (!missing?.size) continue;

    const existing = parseImportSpecifiers(match[1]);
    const localNames = existing.map((item) => item.split(/\s+as\s+/i).at(-1)?.trim() || item.trim());
    const additions = [...missing].filter((name) => !localNames.includes(name)).sort();
    if (!additions.length) {
      remaining.delete(path);
      continue;
    }

    const mergedNames = [...existing, ...additions].sort((first, second) =>
      importLocalName(first).localeCompare(importLocalName(second)),
    );
    const replacement = buildImportLine(mergedNames, path);
    const start = match.index ?? 0;
    const end = start + match[0].length;
    nextSource = `${nextSource.slice(0, start)}${replacement}${nextSource.slice(end)}`;
    remaining.delete(path);
  }

  return { source: nextSource, remaining };
}

function parseImportSpecifiers(specifiers) {
  return specifiers
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function importLocalName(specifier) {
  return specifier.split(/\s+as\s+/i).at(-1)?.trim() || specifier.trim();
}

function buildImportLine(names, path) {
  if (names.length <= 3) {
    return `import { ${names.join(", ")} } from "${path}";`;
  }

  return `import {\n  ${names.join(",\n  ")},\n} from "${path}";`;
}

function insertAfterImportBlock(source, importBlock) {
  const importMatches = [...source.matchAll(/^import[\s\S]*?;\s*$/gm)];
  const normalizedBlock = importBlock.trim();
  if (!importMatches.length) {
    return `${normalizedBlock}\n\n${source.replace(/^\n+/, "")}`;
  }

  const last = importMatches[importMatches.length - 1];
  const insertAt = (last.index ?? 0) + last[0].length;
  return `${source.slice(0, insertAt).replace(/\s*$/, "")}\n${normalizedBlock}\n\n${source.slice(insertAt).replace(/^\n+/, "")}`;
}

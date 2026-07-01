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

  const existingImports = collectExistingImports(source);
  const missingByPath = new Map();
  for (const component of used) {
    const target = SHADCN_JSX_IMPORTS[component];
    if (!target) continue;
    if (existingImports.get(target.path)?.has(target.name)) continue;

    const names = missingByPath.get(target.path) ?? new Set();
    names.add(target.name);
    missingByPath.set(target.path, names);
  }

  const missingImports = [...missingByPath.entries()]
    .sort(([first], [second]) => first.localeCompare(second))
    .map(([path, names]) => buildImportLine([...names].sort(), path));

  if (!missingImports.length) return source;
  return insertAfterImportBlock(source, `${missingImports.join("\n")}\n`);
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

function collectExistingImports(source) {
  const imports = new Map();
  for (const match of source.matchAll(
    /import\s+(?:type\s+)?\{([\s\S]*?)\}\s+from\s+["']([^"']+)["'];?/g,
  )) {
    const path = match[2];
    const names = imports.get(path) ?? new Set();
    for (const item of match[1].split(",")) {
      const name = item.trim().split(/\s+as\s+/i)[0];
      if (name) names.add(name);
    }
    imports.set(path, names);
  }
  return imports;
}

function buildImportLine(names, path) {
  if (names.length <= 3) {
    return `import { ${names.join(", ")} } from "${path}";`;
  }

  return `import {\n  ${names.join(",\n  ")},\n} from "${path}";`;
}

function insertAfterImportBlock(source, importBlock) {
  const importMatches = [...source.matchAll(/^import[\s\S]*?;\s*$/gm)];
  if (!importMatches.length) {
    return `${importBlock}\n${source}`;
  }

  const last = importMatches[importMatches.length - 1];
  const insertAt = (last.index ?? 0) + last[0].length;
  return `${source.slice(0, insertAt)}\n${importBlock}${source.slice(insertAt).replace(/^\n/, "")}`;
}

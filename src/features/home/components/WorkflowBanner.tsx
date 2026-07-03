import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Camera,
  CheckCircle2,
  ChevronRight,
  Code2,
  SearchCheck,
  Sparkles,
  Wrench,
} from "lucide-react";

export function WorkflowBanner() {
  const steps = [
    { label: "UI Screenshot", icon: Camera },
    { label: "Layout Detection", icon: SearchCheck },
    { label: "Component Plan", icon: Sparkles },
    { label: "React Code", icon: Code2 },
    { label: "Refine Details", icon: Wrench },
    { label: "Final Component", icon: CheckCircle2 },
  ];

  return (
    <Card aria-label="Workflow pipeline">
      <CardHeader>
        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Screenshot → Plan → React
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="flex flex-wrap items-center gap-y-3 gap-x-1">
          {steps.map((step, i) => (
            <li key={step.label} className="flex items-center gap-x-1">
              <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 text-sm font-medium">
                <step.icon className="size-3.5" aria-hidden="true" />
                <span>{step.label}</span>
              </Badge>
              {i < steps.length - 1 ? (
                <ChevronRight
                  className="mx-1 size-4 shrink-0 text-muted-foreground"
                  aria-hidden
                />
              ) : null}
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}

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

interface WorkflowBannerProps {
  ariaLabel?: string;
  title?: string;
  stepLabels?: string[];
}

const defaultStepLabels = [
  "UI screenshot",
  "Layout detection",
  "Component plan",
  "React code",
  "Refine details",
  "Final component",
];

export function WorkflowBanner({
  ariaLabel = "Workflow pipeline",
  title = "Screenshot -> Plan -> React",
  stepLabels = defaultStepLabels,
}: WorkflowBannerProps) {
  const steps = [
    { label: stepLabels[0] ?? defaultStepLabels[0], icon: Camera },
    { label: stepLabels[1] ?? defaultStepLabels[1], icon: SearchCheck },
    { label: stepLabels[2] ?? defaultStepLabels[2], icon: Sparkles },
    { label: stepLabels[3] ?? defaultStepLabels[3], icon: Code2 },
    { label: stepLabels[4] ?? defaultStepLabels[4], icon: Wrench },
    { label: stepLabels[5] ?? defaultStepLabels[5], icon: CheckCircle2 },
  ];

  return (
    <Card aria-label={ariaLabel}>
      <CardHeader>
        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="flex flex-wrap items-center gap-x-1 gap-y-3">
          {steps.map((step, i) => (
            <li key={step.label} className="flex items-center gap-x-1">
              <Badge
                variant="secondary"
                className="gap-1.5 px-3 py-1.5 text-sm font-medium"
              >
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

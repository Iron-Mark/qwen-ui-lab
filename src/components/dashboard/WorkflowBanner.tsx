export function WorkflowBanner() {
  const steps = [
    { label: "UI Screenshot", icon: "📸" },
    { label: "Qwen3-VL Analysis", icon: "🔍" },
    { label: "Component Plan", icon: "📐" },
    { label: "Qwen Code Scaffold", icon: "⚡" },
    { label: "Human Refactor", icon: "✏️" },
    { label: "Final Component", icon: "✅" },
  ];

  return (
    <section
      aria-label="Workflow pipeline"
      className="rounded-lg border border-border bg-card p-6"
    >
      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Screenshot → Plan → Patch
      </h3>
      <ol className="mt-4 flex flex-wrap items-center gap-y-3 gap-x-1">
        {steps.map((step, i) => (
          <li key={step.label} className="flex items-center gap-x-1">
            <span className="flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1.5 text-sm font-medium text-card-foreground">
              <span aria-hidden="true">{step.icon}</span>
              <span>{step.label}</span>
            </span>
            {i < steps.length - 1 && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mx-1 shrink-0 text-muted-foreground"
                aria-hidden="true"
              >
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}

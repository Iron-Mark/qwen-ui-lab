"use client";

import { useState, type ReactNode } from "react";
import type { LawOfUxId } from "@/lib/laws-of-ux";
import { cn } from "@/lib/utils";

function FittsExample() {
  return (
    <div className="flex flex-wrap items-end justify-center gap-6">
      <button
        type="button"
        className="rounded border border-border px-2 py-1 text-[10px] text-muted-foreground"
        disabled
      >
        Small (hard)
      </button>
      <button
        type="button"
        className="min-h-14 min-w-40 rounded-lg bg-accent px-6 py-4 text-sm font-semibold text-accent-foreground"
      >
        Large target (easy)
      </button>
    </div>
  );
}

function HickExample() {
  const [mode, setMode] = useState<"few" | "many">("few");
  const many = ["PNG", "JPG", "SVG", "WebP", "HEIC", "GIF", "TIFF", "BMP"];
  const few = ["Analyze", "Prepare preview"];

  return (
    <div className="space-y-3">
      <div className="flex justify-center gap-2">
        {(["few", "many"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setMode(value)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-semibold",
              mode === value
                ? "border-accent bg-accent text-accent-foreground"
                : "border-border bg-background text-muted-foreground",
            )}
          >
            {value === "few" ? "Staged CTAs" : "Many choices"}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {(mode === "few" ? few : many).map((label) => (
          <span
            key={label}
            className="rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-card-foreground"
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

function MillerExample() {
  const items = Array.from({ length: 12 }, (_, i) => `Item ${i + 1}`);
  const chunks = [
    items.slice(0, 4),
    items.slice(4, 8),
    items.slice(8, 12),
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <p className="mb-2 text-xs font-semibold text-muted-foreground">12 raw items</p>
        <ul className="space-y-1 text-xs text-card-foreground">
          {items.map((item) => (
            <li key={item} className="rounded border border-border px-2 py-0.5">
              {item}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <p className="mb-2 text-xs font-semibold text-accent">Chunked (3x4)</p>
        <div className="space-y-2">
          {chunks.map((chunk, index) => (
            <ul
              key={index}
              className="rounded-lg border border-accent/40 bg-accent/5 p-2 text-xs text-card-foreground"
            >
              {chunk.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </div>
  );
}

function SerialPositionExample() {
  const steps = ["Upload", "Analyze", "Plan", "Preview", "Export"];
  return (
    <ol className="flex flex-wrap justify-center gap-2">
      {steps.map((step, index) => (
        <li
          key={step}
          className={cn(
            "rounded-full border px-3 py-1 text-xs font-semibold",
            index === 0 || index === steps.length - 1
              ? "border-accent bg-accent text-accent-foreground"
              : "border-border bg-muted text-muted-foreground",
          )}
        >
          {step}
        </li>
      ))}
    </ol>
  );
}

function VonRestorffExample() {
  const rows = ["Stat A", "Stat B", "Stat C", "Stat D"];
  return (
    <ul className="flex flex-wrap justify-center gap-2">
      {rows.map((label) => (
        <li
          key={label}
          className={cn(
            "rounded-lg border px-4 py-3 text-sm font-medium",
            label === "Stat B"
              ? "border-accent bg-accent text-accent-foreground shadow-sm"
              : "border-border bg-card text-muted-foreground",
          )}
        >
          {label}
        </li>
      ))}
    </ul>
  );
}

function AestheticExample() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-center text-xs text-muted-foreground">
        Plain box
        <div className="mt-2 text-[10px]">Feels harder to use</div>
      </div>
      <div className="rounded-xl border border-border bg-card p-4 text-center shadow-sm">
        <div className="text-sm font-semibold text-card-foreground">Polished card</div>
        <div className="mt-1 text-xs text-muted-foreground">Reads as more usable</div>
      </div>
    </div>
  );
}

function DohertyExample() {
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  function runInstant() {
    setPending(false);
    setDone(true);
    setTimeout(() => setDone(false), 1200);
  }

  function runSlow() {
    setPending(true);
    setDone(false);
    setTimeout(() => {
      setPending(false);
      setDone(true);
      setTimeout(() => setDone(false), 1200);
    }, 900);
  }

  return (
    <div className="flex flex-wrap justify-center gap-3">
      <button
        type="button"
        onClick={runInstant}
        className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground"
      >
        &lt;400ms feedback
      </button>
      <button
        type="button"
        onClick={runSlow}
        className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-card-foreground"
      >
        Slow response
      </button>
      {pending ? (
        <span className="w-full text-center text-xs text-muted-foreground">Waiting...</span>
      ) : null}
      {done ? (
        <span className="w-full text-center text-xs font-semibold text-success">
          Done - flow continues
        </span>
      ) : null}
    </div>
  );
}

function GoalGradientExample() {
  const [step, setStep] = useState(2);
  const labels = ["Upload", "Analyze", "Plan", "Preview", "Export"];
  return (
    <div className="space-y-3">
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-accent transition-all duration-300"
          style={{ width: `${((step + 1) / labels.length) * 100}%` }}
        />
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {labels.map((label, index) => (
          <button
            key={label}
            type="button"
            onClick={() => setStep(index)}
            className={cn(
              "rounded-full border px-2.5 py-0.5 text-xs font-semibold",
              index <= step
                ? "border-accent bg-accent/10 text-accent"
                : "border-border text-muted-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

function TeslerExample() {
  const [advanced, setAdvanced] = useState(false);
  return (
    <div className="mx-auto max-w-xs space-y-3 text-center">
      <button
        type="button"
        onClick={() => setAdvanced((value) => !value)}
        className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground"
      >
        {advanced ? "Hide" : "Show"} advanced settings
      </button>
      {advanced ? (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-left text-xs text-amber-900 dark:text-amber-100">
          Advanced setup stays out of the main workflow until a team needs it.
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Default path: upload, review, and export without extra setup.
        </p>
      )}
    </div>
  );
}

function PeakEndExample() {
  return (
    <div className="space-y-2 text-center text-xs">
      <div className="flex justify-between gap-1">
        {["Upload", "Analyze", "Preview", "Export complete"].map((label, i) => (
          <span
            key={label}
            className={cn(
              "flex-1 rounded py-1",
              i === 1 ? "bg-accent/20 font-semibold text-accent" : "",
              i === 3 ? "bg-success/20 font-semibold text-success" : "text-muted-foreground",
            )}
          >
            {label}
          </span>
        ))}
      </div>
      <p className="text-muted-foreground">Peak (analyze) + end (export) shape the memory.</p>
    </div>
  );
}

function JakobExample() {
  return (
    <nav className="flex justify-center gap-4 rounded-lg border border-border bg-card px-4 py-3 text-sm">
      <span className="font-semibold text-card-foreground">Dashboard</span>
      <span className="text-muted-foreground">Design system</span>
      <span className="text-muted-foreground">Account</span>
    </nav>
  );
}

function ParkinsonExample() {
  return (
    <ul className="space-y-1 text-xs text-muted-foreground">
      {["Reading image...", "Preparing analysis...", "Preparing preview..."].map((step) => (
        <li key={step} className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
          {step}
        </li>
      ))}
    </ul>
  );
}

function ChoiceOverloadExample() {
  return <HickExample />;
}

function CognitiveLoadExample() {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <div className="rounded border border-danger/30 bg-danger/5 p-2 text-[10px] text-danger">
        Reference + plan + code stacked
      </div>
      <div className="rounded border border-success/30 bg-success/5 p-2 text-[10px] text-success">
        Split view: reference | output
      </div>
    </div>
  );
}

function ChunkingExample() {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {["atom", "molecule", "organism"].map((tier) => (
        <span
          key={tier}
          className="rounded-full border border-border bg-muted px-3 py-1 text-xs font-semibold capitalize text-card-foreground"
        >
          {tier}
        </span>
      ))}
    </div>
  );
}

const EXAMPLE_MAP: Record<LawOfUxId, () => ReactNode> = {
  "aesthetic-usability": AestheticExample,
  fitts: FittsExample,
  hick: HickExample,
  jakob: JakobExample,
  miller: MillerExample,
  parkinson: ParkinsonExample,
  "peak-end": PeakEndExample,
  "serial-position": SerialPositionExample,
  tesler: TeslerExample,
  "von-restorff": VonRestorffExample,
  doherty: DohertyExample,
  "choice-overload": ChoiceOverloadExample,
  "cognitive-load": CognitiveLoadExample,
  "goal-gradient": GoalGradientExample,
  chunking: ChunkingExample,
};

export function LawOfUxExample({ lawId }: { lawId: LawOfUxId }) {
  const Example = EXAMPLE_MAP[lawId];
  return Example ? <Example /> : null;
}

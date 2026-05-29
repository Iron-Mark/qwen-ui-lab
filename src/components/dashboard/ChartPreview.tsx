export function ChartPreview() {
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-card-foreground">
          Performance Chart
        </h3>
        <p className="text-sm text-muted-foreground">
          Visual analytics placeholder
        </p>
      </div>

      <div className="flex h-64 items-center justify-center rounded-md border-2 border-dashed border-border bg-muted">
        <div className="text-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mx-auto mb-3 text-muted-foreground"
          >
            <line x1="18" y1="20" x2="18" y2="10"></line>
            <line x1="12" y1="20" x2="12" y2="4"></line>
            <line x1="6" y1="20" x2="6" y2="14"></line>
          </svg>
          <p className="text-sm font-medium text-muted-foreground">
            Chart integration pending
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Add recharts, chart.js, or similar
          </p>
        </div>
      </div>
    </div>
  );
}

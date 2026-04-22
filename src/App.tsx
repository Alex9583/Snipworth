export function App() {
  return (
    <div className="min-h-screen bg-canvas p-6 font-sans text-ink">
      <h1 className="mb-2 text-2xl font-semibold tracking-tight">Snipworth</h1>
      <p className="text-ink-muted">
        Design tokens loaded. Accent:{' '}
        <span className="font-mono text-accent">var(--color-accent)</span>
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <div className="rounded-sm border border-line bg-surface p-4 shadow-sm">
          <div className="mb-1 text-xs text-ink-subtle">surface</div>
          <div className="text-ink">rounded-sm · shadow-sm</div>
        </div>
        <div className="rounded-md border border-line bg-elevated p-4 shadow-md">
          <div className="mb-1 text-xs text-ink-subtle">elevated</div>
          <div className="text-ink">rounded-md · shadow-md</div>
        </div>
        <div className="rounded-lg bg-accent p-4 font-medium text-white">
          rounded-lg · bg-accent
        </div>
      </div>
    </div>
  );
}

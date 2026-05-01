import type { AppMode } from './AppMode';

export function App({ mode }: { mode: AppMode }) {
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <p className="text-ink-muted">
        App boot OK in <span className="font-mono text-ink">{mode}</span> mode.
      </p>
    </main>
  );
}

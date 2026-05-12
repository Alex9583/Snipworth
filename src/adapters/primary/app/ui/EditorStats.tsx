import { charsCount, linesCount } from '../editor-stats';
import { editorStatsLabel } from '../editor-stats.strings';

interface EditorStatsProps {
  readonly code: string;
}

export function EditorStats({ code }: EditorStatsProps) {
  const label = editorStatsLabel(linesCount(code), charsCount(code));
  return (
    <div role="status" aria-live="polite" className="text-ink-muted font-mono text-xs tabular-nums">
      {label}
    </div>
  );
}

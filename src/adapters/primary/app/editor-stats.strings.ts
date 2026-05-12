export function editorStatsLabel(lines: number, chars: number): string {
  return `${lineCountLabel(lines)} · ${charCountLabel(chars)} · LF · UTF-8`;
}

function lineCountLabel(lines: number): string {
  return `${String(lines)} ${lines === 1 ? 'line' : 'lines'}`;
}

function charCountLabel(chars: number): string {
  return `${String(chars)} ${chars === 1 ? 'char' : 'chars'}`;
}

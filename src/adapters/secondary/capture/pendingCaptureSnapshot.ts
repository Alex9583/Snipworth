export interface PendingCaptureSnapshot {
  readonly code: string;
  readonly sourceUrl: string | null;
}

export function parsePendingCaptureSnapshot(value: unknown): PendingCaptureSnapshot | undefined {
  if (typeof value !== 'object' || value === null) return undefined;
  const candidate = value as { code?: unknown; sourceUrl?: unknown };
  if (typeof candidate.code !== 'string') return undefined;
  if (candidate.sourceUrl !== null && typeof candidate.sourceUrl !== 'string') return undefined;
  return { code: candidate.code, sourceUrl: candidate.sourceUrl };
}

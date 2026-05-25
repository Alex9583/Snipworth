const SECOND_MS = 1_000;
const MINUTE_MS = 60 * SECOND_MS;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

const formatter = new Intl.RelativeTimeFormat('en');

export function relativeTimeLabel(from: Date, now: Date): string {
  const diffMs = from.getTime() - now.getTime();
  const abs = Math.abs(diffMs);
  if (abs < MINUTE_MS) return formatter.format(Math.round(diffMs / SECOND_MS), 'second');
  if (abs < HOUR_MS) return formatter.format(Math.round(diffMs / MINUTE_MS), 'minute');
  if (abs < DAY_MS) return formatter.format(Math.round(diffMs / HOUR_MS), 'hour');
  return formatter.format(Math.round(diffMs / DAY_MS), 'day');
}

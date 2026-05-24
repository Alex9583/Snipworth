const SECOND_MS = 1_000;
const MINUTE_MS = 60 * SECOND_MS;
const DAY_MS = 24 * 60 * MINUTE_MS;

const formatter = new Intl.RelativeTimeFormat('en');

export function relativeTimeLabel(from: Date, now: Date): string {
  const diffMs = from.getTime() - now.getTime();
  if (Math.abs(diffMs) < MINUTE_MS) {
    const seconds = Math.round(diffMs / SECOND_MS);
    return formatter.format(seconds, 'second');
  }
  const days = Math.round(diffMs / DAY_MS);
  return formatter.format(days, 'day');
}

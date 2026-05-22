const DAY_MS = 24 * 60 * 60 * 1000;

const formatter = new Intl.RelativeTimeFormat('en');

export function relativeDaysLabel(from: Date, now: Date): string {
  const days = Math.round((from.getTime() - now.getTime()) / DAY_MS);
  return formatter.format(days, 'day');
}

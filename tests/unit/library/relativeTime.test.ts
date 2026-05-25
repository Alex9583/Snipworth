import { describe, it, expect } from 'vitest';

import { relativeTimeLabel } from '@/adapters/primary/library/relativeTime';

function ago(ms: number): { from: Date; now: Date } {
  const now = new Date('2026-01-15T12:00:00Z');
  return { from: new Date(now.getTime() - ms), now };
}

const SECOND = 1_000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

describe('relativeTimeLabel', () => {
  it('should_return_seconds_when_difference_is_under_one_minute', () => {
    const { from, now } = ago(30 * SECOND);
    expect(relativeTimeLabel(from, now)).toBe('30 seconds ago');
  });

  it('should_return_minutes_when_difference_is_under_one_hour', () => {
    const { from, now } = ago(5 * MINUTE);
    expect(relativeTimeLabel(from, now)).toBe('5 minutes ago');
  });

  it('should_return_hours_when_difference_is_under_one_day', () => {
    const { from, now } = ago(3 * HOUR);
    expect(relativeTimeLabel(from, now)).toBe('3 hours ago');
  });

  it('should_return_days_when_difference_is_one_day_or_more', () => {
    const { from, now } = ago(2 * DAY);
    expect(relativeTimeLabel(from, now)).toBe('2 days ago');
  });

  it('should_transition_from_seconds_to_minutes_at_the_one_minute_boundary', () => {
    const { from, now } = ago(59 * SECOND);
    expect(relativeTimeLabel(from, now)).toContain('second');

    const atMinute = ago(60 * SECOND);
    expect(relativeTimeLabel(atMinute.from, atMinute.now)).toContain('minute');
  });

  it('should_transition_from_minutes_to_hours_at_the_one_hour_boundary', () => {
    const { from, now } = ago(59 * MINUTE);
    expect(relativeTimeLabel(from, now)).toContain('minute');

    const atHour = ago(60 * MINUTE);
    expect(relativeTimeLabel(atHour.from, atHour.now)).toContain('hour');
  });

  it('should_transition_from_hours_to_days_at_the_one_day_boundary', () => {
    const { from, now } = ago(23 * HOUR);
    expect(relativeTimeLabel(from, now)).toContain('hour');

    const atDay = ago(24 * HOUR);
    expect(relativeTimeLabel(atDay.from, atDay.now)).toContain('day');
  });

  it('should_use_singular_form_for_one_unit', () => {
    const oneMinute = ago(1 * MINUTE);
    expect(relativeTimeLabel(oneMinute.from, oneMinute.now)).toBe('1 minute ago');

    const oneHour = ago(1 * HOUR);
    expect(relativeTimeLabel(oneHour.from, oneHour.now)).toBe('1 hour ago');

    const oneDay = ago(1 * DAY);
    expect(relativeTimeLabel(oneDay.from, oneDay.now)).toBe('1 day ago');
  });
});

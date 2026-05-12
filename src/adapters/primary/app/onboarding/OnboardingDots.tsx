import { clsx } from 'clsx';

import { dotsLabelFor } from './onboarding.strings';

export interface OnboardingDotsProps {
  readonly activeIndex: number;
  readonly total: number;
}

export function OnboardingDots({ activeIndex, total }: OnboardingDotsProps) {
  return (
    <div
      role="status"
      aria-label={dotsLabelFor(activeIndex, total)}
      className="flex justify-center gap-1.5"
    >
      {Array.from({ length: total }, (_, index) => (
        <span
          key={index}
          aria-hidden="true"
          className={clsx(
            'h-1.5 rounded-sm transition-all',
            index === activeIndex ? 'bg-accent w-4.5' : 'bg-line w-1.5',
          )}
        />
      ))}
    </div>
  );
}

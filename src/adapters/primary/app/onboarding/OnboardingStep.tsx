import type { ReactNode } from 'react';

import { OnboardingDots } from './OnboardingDots';

export interface OnboardingStepProps {
  readonly title: string;
  readonly body: string;
  readonly illustration: ReactNode;
  readonly primary: ReactNode;
  readonly secondary?: ReactNode;
  readonly activeIndex: number;
  readonly total: number;
}

export function OnboardingStep({
  title,
  body,
  illustration,
  primary,
  secondary,
  activeIndex,
  total,
}: OnboardingStepProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-8 py-5 text-center">
        {illustration}
        <h1 className="text-ink mt-8 mb-2.5 text-balance text-[22px] font-semibold tracking-tight">
          {title}
        </h1>
        <p className="text-ink-muted max-w-85 text-pretty text-sm leading-relaxed">{body}</p>
      </div>
      <div className="border-line flex flex-col gap-3.5 border-t px-6 pt-3.5 pb-5">
        <div className="flex justify-center gap-2">
          {secondary}
          {primary}
        </div>
        <OnboardingDots activeIndex={activeIndex} total={total} />
      </div>
    </div>
  );
}

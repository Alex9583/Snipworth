import { useCallback, useState } from 'react';

import { WINDOW_OPENER, type LinkOpener } from '../LinkOpener';
import { Button } from '../ui/Button';
import { ArrowRightIcon, CoffeeIcon } from '../ui/icons';
import { OnboardingStep } from './OnboardingStep';
import { Step1Illustration, Step2Illustration, Step3Illustration } from './illustrations';
import { ONBOARDING } from './onboarding.strings';

export interface OnboardingProps {
  readonly onComplete: () => void;
  readonly linkOpener?: LinkOpener;
}

const TOTAL_STEPS = 3;

export function Onboarding({ onComplete, linkOpener = WINDOW_OPENER }: OnboardingProps) {
  const [stepIndex, setStepIndex] = useState(0);

  const goNext = useCallback(() => {
    setStepIndex((current) => current + 1);
  }, []);

  const goBack = useCallback(() => {
    setStepIndex((current) => current - 1);
  }, []);

  const openBmac = useCallback(() => {
    linkOpener.open(__SNIPWORTH_BMAC_URL__);
  }, [linkOpener]);

  if (stepIndex === 0) {
    return (
      <OnboardingStep
        activeIndex={0}
        total={TOTAL_STEPS}
        title={ONBOARDING.step1Title}
        body={ONBOARDING.step1Body}
        illustration={<Step1Illustration />}
        primary={
          <Button onClick={goNext} iconRight={<ArrowRightIcon size={14} />}>
            {ONBOARDING.step1Cta}
          </Button>
        }
      />
    );
  }

  if (stepIndex === 1) {
    return (
      <OnboardingStep
        activeIndex={1}
        total={TOTAL_STEPS}
        title={ONBOARDING.step2Title}
        body={ONBOARDING.step2Body}
        illustration={<Step2Illustration />}
        secondary={
          <Button variant="ghost" onClick={goBack}>
            {ONBOARDING.step2Back}
          </Button>
        }
        primary={
          <Button onClick={goNext} iconRight={<ArrowRightIcon size={14} />}>
            {ONBOARDING.step2Cta}
          </Button>
        }
      />
    );
  }

  return (
    <OnboardingStep
      activeIndex={2}
      total={TOTAL_STEPS}
      title={ONBOARDING.step3Title}
      body={ONBOARDING.step3Body}
      illustration={<Step3Illustration />}
      secondary={
        <Button variant="outline" onClick={openBmac} iconLeft={<CoffeeIcon size={13} />}>
          {ONBOARDING.step3Bmac}
        </Button>
      }
      primary={<Button onClick={onComplete}>{ONBOARDING.step3Cta}</Button>}
    />
  );
}

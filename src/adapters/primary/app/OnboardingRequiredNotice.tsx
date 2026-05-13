import { ONBOARDING_REQUIRED_NOTICE } from './OnboardingRequiredNotice.strings';
import { LogoChip } from './ui/LogoChip';

export function OnboardingRequiredNotice() {
  return (
    <main
      aria-labelledby="onboarding-required-heading"
      className="bg-canvas flex h-screen items-center justify-center px-6"
    >
      <div className="flex max-w-md flex-col items-center gap-5 text-center">
        <LogoChip size={56} label={ONBOARDING_REQUIRED_NOTICE.logoLabel} />
        <h1
          id="onboarding-required-heading"
          className="text-ink text-xl leading-tight font-semibold"
        >
          {ONBOARDING_REQUIRED_NOTICE.heading}
        </h1>
        <p className="text-ink-muted text-pretty">{ONBOARDING_REQUIRED_NOTICE.body}</p>
        <div className="flex flex-col items-start gap-2 text-left">
          <p className="text-ink-muted text-sm">{ONBOARDING_REQUIRED_NOTICE.instructionsLeader}</p>
          <ol className="text-ink list-decimal pl-5 text-sm leading-relaxed">
            <li>{ONBOARDING_REQUIRED_NOTICE.instructionStep1}</li>
            <li>{ONBOARDING_REQUIRED_NOTICE.instructionStep2}</li>
            <li>{ONBOARDING_REQUIRED_NOTICE.instructionStep3}</li>
          </ol>
        </div>
      </div>
    </main>
  );
}

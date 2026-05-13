import { MousePointerIcon, CoffeeIcon } from '../ui/icons';
import { ONBOARDING } from './onboarding.strings';

export function Step1Illustration() {
  return (
    <div
      role="img"
      aria-label={ONBOARDING.step1IllustrationLabel}
      className="flex h-35 w-35 items-center justify-center rounded-[28px]"
      style={{
        background:
          'linear-gradient(135deg, color-mix(in oklab, var(--color-accent) 25%, transparent), color-mix(in oklab, var(--color-accent) 5%, transparent))',
        border: '1px solid color-mix(in oklab, var(--color-accent) 30%, transparent)',
        boxShadow: '0 20px 60px -20px color-mix(in oklab, var(--color-accent) 45%, transparent)',
      }}
    >
      <WelcomeLogoMark />
    </div>
  );
}

function WelcomeLogoMark() {
  return (
    <svg
      width={110}
      height={88}
      viewBox="0 0 40 32"
      fill="none"
      stroke="var(--color-accent)"
      strokeWidth={3.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M3 6 L3 26" />
      <path d="M13 9 L7 16 L13 23" />
      <path d="M23 7 L17 25" />
      <path d="M27 9 L33 16 L27 23" />
      <path d="M37 6 L37 26" />
    </svg>
  );
}

export function Step2Illustration() {
  return (
    <div role="img" aria-label={ONBOARDING.step2IllustrationLabel} className="relative h-35 w-55">
      <ContextMenuCodeBlock />
      <CursorMark />
      <ContextMenu />
    </div>
  );
}

function ContextMenuCodeBlock() {
  return (
    <div
      className="border-line absolute top-0 left-0 h-25 w-40 overflow-hidden rounded-lg border p-2.5 text-left font-mono leading-normal"
      style={{
        background: '#121212',
        color: 'rgba(219, 215, 202, 0.67)',
        fontSize: 9,
        boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
      }}
    >
      <div>
        <span style={{ color: '#cb7676' }}>{ONBOARDING.step2CodeKeywordConst}</span>{' '}
        <span style={{ color: '#bd976a' }}>{ONBOARDING.step2CodeIdentifierApi}</span>
        {' = '}
        <span style={{ color: '#c98a7d' }}>{ONBOARDING.step2CodeStringSlashVOne}</span>
        {';'}
      </div>
      <div>
        <span style={{ color: '#cb7676' }}>{ONBOARDING.step2CodeKeywordFunction}</span>{' '}
        <span style={{ color: '#80a665' }}>{ONBOARDING.step2CodeIdentifierFetch}</span>
        {`() ${ONBOARDING.step2CodeOpenBrace}`}
      </div>
      <div
        style={{
          background: 'color-mix(in oklab, var(--color-accent) 22%, transparent)',
          margin: '2px -10px',
          padding: '0 10px',
        }}
      >
        {'  '}
        <span style={{ color: '#cb7676' }}>{ONBOARDING.step2CodeKeywordReturn}</span>{' '}
        <span style={{ color: '#80a665' }}>{ONBOARDING.step2CodeIdentifierGet}</span>
        {'('}
        {ONBOARDING.step2CodeIdentifierApiArg}
        {');'}
      </div>
      <div>{ONBOARDING.step2CodeCloseBrace}</div>
    </div>
  );
}

function CursorMark() {
  return (
    <div className="text-ink absolute top-15 left-30">
      <MousePointerIcon size={20} strokeWidth={2} />
    </div>
  );
}

function ContextMenu() {
  return (
    <div
      className="border-line text-ink absolute top-18.5 left-35 w-42.5 overflow-hidden rounded-md border text-[11px]"
      style={{
        background: 'var(--color-elevated)',
        boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
      }}
    >
      <ContextMenuItem label={ONBOARDING.step2ContextCopy} />
      <ContextMenuItem label={ONBOARDING.step2ContextSearch} />
      <ContextMenuActiveItem label={ONBOARDING.step2ContextSnipworth} />
      <ContextMenuItem label={ONBOARDING.step2ContextInspect} />
    </div>
  );
}

function ContextMenuItem({ label }: { readonly label: string }) {
  return <div className="text-ink-muted px-2.5 py-1">{label}</div>;
}

function ContextMenuActiveItem({ label }: { readonly label: string }) {
  return (
    <div
      className="text-accent flex items-center gap-1.5 px-2.5 py-1 font-medium"
      style={{ background: 'color-mix(in oklab, var(--color-accent) 20%, transparent)' }}
    >
      <span aria-hidden="true" className="bg-accent inline-block h-2.5 w-2.5 rounded-xs" />
      {label}
    </div>
  );
}

export function Step3Illustration() {
  return (
    <div role="img" aria-label={ONBOARDING.step3IllustrationLabel} className="relative">
      <div
        aria-hidden="true"
        className="absolute -inset-5"
        style={{
          background:
            'radial-gradient(circle, color-mix(in oklab, var(--color-accent) 40%, transparent), transparent 65%)',
          filter: 'blur(8px)',
        }}
      />
      <div
        className="relative flex h-35 w-35 items-center justify-center rounded-[28px] text-white"
        style={{
          background: 'linear-gradient(135deg, var(--color-accent), var(--color-accent-2))',
          boxShadow: '0 20px 60px -10px color-mix(in oklab, var(--color-accent) 60%, transparent)',
        }}
      >
        <CoffeeIcon size={64} strokeWidth={1.75} />
      </div>
    </div>
  );
}

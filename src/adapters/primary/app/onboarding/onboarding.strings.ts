export const ONBOARDING = {
  step1Title: 'Welcome to Snipworth',
  step1Body: 'Turn code into beautiful images, ready to post.',
  step1Cta: 'Get started',
  step1IllustrationLabel: 'Snipworth welcome illustration',

  step2Title: 'Capture from anywhere',
  step2Body: 'Right-click any code on the web to instantly snip it.',
  step2Back: 'Back',
  step2Cta: 'Next',
  step2IllustrationLabel: 'Right-click context menu illustration',
  step2CodeKeywordConst: 'const',
  step2CodeIdentifierApi: 'api',
  step2CodeStringSlashVOne: '"/v1"',
  step2CodeKeywordFunction: 'function',
  step2CodeIdentifierFetch: 'fetch',
  step2CodeOpenBrace: '{',
  step2CodeCloseBrace: '}',
  step2CodeKeywordReturn: 'return',
  step2CodeIdentifierGet: 'get',
  step2CodeIdentifierApiArg: 'api',
  step2ContextCopy: 'Copy',
  step2ContextSearch: 'Search Google',
  step2ContextSnipworth: 'Snipworth this code',
  step2ContextInspect: 'Inspect',

  step3Title: 'Free and open source',
  step3Body:
    'Snipworth runs entirely on your machine — no servers, no tracking. If it helps you, consider buying me a coffee.',
  step3Bmac: 'Buy me a coffee',
  step3Cta: 'Start using Snipworth',
  step3IllustrationLabel: 'Coffee illustration',

  dotsLabel: 'Onboarding progress',
} as const;

export function dotsLabelFor(activeIndex: number, total: number): string {
  return `${ONBOARDING.dotsLabel}: step ${String(activeIndex + 1)} of ${String(total)}`;
}

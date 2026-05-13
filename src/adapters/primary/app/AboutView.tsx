import type { ReactNode } from 'react';

import { ABOUT_VIEW } from './AboutView.strings';
import { versionBadgeLabel } from './app.strings';
import { WINDOW_OPENER, type LinkOpener } from './LinkOpener';
import { Badge } from './ui/Badge';
import { ArrowUpRightIcon, CoffeeIcon, GithubIcon } from './ui/icons';
import { LogoChip } from './ui/LogoChip';

interface AboutViewProps {
  readonly version?: string;
  readonly linkOpener?: LinkOpener;
}

export function AboutView({
  version = __SNIPWORTH_VERSION__,
  linkOpener = WINDOW_OPENER,
}: AboutViewProps = {}) {
  return (
    <section
      aria-labelledby="about-heading"
      className="bg-canvas min-h-0 flex-1 overflow-auto px-12 py-12"
    >
      <div className="mx-auto flex max-w-2xl flex-col gap-8">
        <header className="flex items-center gap-4">
          <LogoChip size={64} label={ABOUT_VIEW.logoLabel} />
          <div className="flex flex-col gap-2">
            <h1
              id="about-heading"
              aria-label={ABOUT_VIEW.heading}
              className="text-ink text-2xl leading-none font-semibold tracking-tight"
            >
              <span className="text-accent">{ABOUT_VIEW.brandPrefix}</span>
              {ABOUT_VIEW.brandSuffix}
            </h1>
            <div className="flex items-center gap-2">
              <Badge>{versionBadgeLabel(version)}</Badge>
              <Badge>{ABOUT_VIEW.licenseLabel}</Badge>
            </div>
          </div>
        </header>

        <p className="text-ink-muted text-pretty">{ABOUT_VIEW.tagline}</p>

        <div className="flex flex-col gap-2.5">
          <LinkCard
            icon={<GithubIcon size={18} />}
            title={ABOUT_VIEW.githubCardTitle}
            subtitle={ABOUT_VIEW.githubCardSubtitle}
            onActivate={() => {
              linkOpener.open(__SNIPWORTH_REPO_URL__);
            }}
          />
          <LinkCard
            icon={<CoffeeIcon size={18} />}
            title={ABOUT_VIEW.bmacCardTitle}
            subtitle={ABOUT_VIEW.bmacCardSubtitle}
            onActivate={() => {
              linkOpener.open(__SNIPWORTH_BMAC_URL__);
            }}
          />
        </div>

        <p className="text-ink-muted text-center text-sm">{ABOUT_VIEW.footerMadeWith}</p>
      </div>
    </section>
  );
}

interface LinkCardProps {
  readonly icon: ReactNode;
  readonly title: string;
  readonly subtitle: string;
  readonly onActivate: () => void;
}

function LinkCard({ icon, title, subtitle, onActivate }: LinkCardProps) {
  return (
    <button
      type="button"
      onClick={onActivate}
      className="border-line bg-surface hover:bg-elevated focus-visible:ring-accent flex items-center gap-3.5 rounded-lg border p-4 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none"
    >
      <span className="border-line bg-elevated text-ink flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border">
        {icon}
      </span>
      <span className="flex flex-1 flex-col gap-0.5">
        <span className="text-ink text-sm font-semibold">{title}</span>
        <span className="text-ink-muted text-xs">{subtitle}</span>
      </span>
      <ArrowUpRightIcon size={16} className="text-ink-muted" />
    </button>
  );
}

import type { FullTabView } from '../FullTabView';
import { APP, versionBadgeLabel } from '../app.strings';
import { WINDOW_OPENER, type LinkOpener } from '../LinkOpener';
import { Badge } from './Badge';
import { Button } from './Button';
import { CoffeeIcon, GithubIcon } from './icons';
import { IconBtn } from './IconBtn';
import { LogoChip } from './LogoChip';
import { Tabs } from './Tabs';
import { TAB_TOP_NAV } from './TabTopNav.strings';

export interface TabTopNavProps {
  readonly activeView: FullTabView;
  readonly onChangeView: (next: FullTabView) => void;
  readonly version?: string;
  readonly linkOpener?: LinkOpener;
}

export function TabTopNav({
  activeView,
  onChangeView,
  version = __SNIPWORTH_VERSION__,
  linkOpener = WINDOW_OPENER,
}: TabTopNavProps) {
  return (
    <header className="border-line bg-canvas flex h-14 shrink-0 items-center justify-between gap-3 border-b px-6">
      <div className="flex items-center gap-3">
        <LogoChip size={28} label={APP.logoLabel} />
        <TabWordmark />
        <Badge>{versionBadgeLabel(version)}</Badge>
      </div>

      <Tabs
        value={activeView}
        onChange={(next) => {
          onChangeView(next as FullTabView);
        }}
      >
        <Tabs.List label={TAB_TOP_NAV.navLabel}>
          <Tabs.Trigger value="editor">{TAB_TOP_NAV.editorTabLabel}</Tabs.Trigger>
          <Tabs.Trigger value="about">{TAB_TOP_NAV.aboutTabLabel}</Tabs.Trigger>
        </Tabs.List>
      </Tabs>

      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          iconLeft={<CoffeeIcon size={13} />}
          title={APP.supportTooltip}
          onClick={() => {
            linkOpener.open(__SNIPWORTH_BMAC_URL__);
          }}
        >
          {APP.supportButton}
        </Button>
        <IconBtn
          label={APP.githubTooltip}
          onClick={() => {
            linkOpener.open(__SNIPWORTH_REPO_URL__);
          }}
        >
          <GithubIcon size={14} />
        </IconBtn>
      </div>
    </header>
  );
}

function TabWordmark() {
  return (
    <span className="text-ink text-base leading-none font-semibold tracking-tight">
      <span className="text-accent">{APP.brandPrefix}</span>
      {APP.brandSuffix}
    </span>
  );
}

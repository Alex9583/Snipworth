import { APP, versionBadgeLabel } from '../app.strings';
import { Badge } from './Badge';
import { IconBtn } from './IconBtn';
import { LogoChip } from './LogoChip';
import { Maximize2Icon } from './icons';

export interface AppHeaderProps {
  readonly onOpenFullTab?: () => void;
  readonly version?: string;
}

export function AppHeader({ onOpenFullTab, version = __SNIPWORTH_VERSION__ }: AppHeaderProps = {}) {
  return (
    <header className="border-line bg-canvas flex h-12 shrink-0 items-center justify-between gap-2.5 border-b px-3">
      <div className="flex items-center gap-2">
        <LogoChip size={24} label={APP.logoLabel} />
        <Wordmark />
        <Badge>{versionBadgeLabel(version)}</Badge>
      </div>
      {onOpenFullTab !== undefined && (
        <IconBtn label={APP.openFullTabTooltip} onClick={onOpenFullTab}>
          <Maximize2Icon size={14} />
        </IconBtn>
      )}
    </header>
  );
}

function Wordmark() {
  return (
    <span className="text-ink text-[15px] leading-none font-semibold tracking-tight">
      <span className="text-accent">{APP.brandPrefix}</span>
      {APP.brandSuffix}
    </span>
  );
}

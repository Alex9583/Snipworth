import type { AppMode } from '../AppMode';
import { APP } from '../app.strings';
import { IconBtn } from './IconBtn';
import { LogoChip } from './LogoChip';
import { Maximize2Icon } from './icons';

export interface AppHeaderProps {
  readonly mode?: AppMode;
  readonly onOpenFullTab?: () => void;
}

export function AppHeader({ mode = 'panel', onOpenFullTab }: AppHeaderProps = {}) {
  const showFullTabButton = mode === 'panel' && onOpenFullTab !== undefined;
  return (
    <header className="border-line bg-canvas flex h-12 shrink-0 items-center justify-between gap-2.5 border-b px-3">
      <div className="flex items-center gap-2.5">
        <LogoChip size={24} label={APP.logoLabel} />
        <Wordmark />
      </div>
      {showFullTabButton && (
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

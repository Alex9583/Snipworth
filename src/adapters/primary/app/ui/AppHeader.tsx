import { APP } from '../app.strings';
import { LogoChip } from './LogoChip';

export function AppHeader() {
  return (
    <header className="border-line bg-canvas flex h-12 shrink-0 items-center gap-2.5 border-b px-3">
      <LogoChip size={24} label={APP.logoLabel} />
      <Wordmark />
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

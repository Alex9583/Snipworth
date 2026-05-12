import { APP } from '../app.strings';
import { WINDOW_OPENER, type LinkOpener } from '../LinkOpener';
import { Button } from './Button';
import { CoffeeIcon, GithubIcon } from './icons';
import { IconBtn } from './IconBtn';

interface AppFooterProps {
  readonly linkOpener?: LinkOpener;
}

export function AppFooter({ linkOpener = WINDOW_OPENER }: AppFooterProps = {}) {
  return (
    <footer className="border-line bg-canvas flex h-10 shrink-0 items-center justify-between border-t px-1.5">
      <Button
        variant="ghost"
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
    </footer>
  );
}

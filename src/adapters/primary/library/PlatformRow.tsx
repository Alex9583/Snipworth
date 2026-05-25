import { Button } from '@/adapters/primary/app/ui/Button';
import { platforms, type Platform } from '@/domain/drafts/Platform';
import { pixelDimensionsForPlatform } from '@/domain/drafts/pixelDimensionsForPlatform';

import { dimensionsLabel } from './PlatformRow.strings';
import { platformDisplayLabel } from '@/adapters/primary/shared/platformLabels';

interface PlatformRowProps {
  readonly currentPlatform: Platform;
  readonly onPlatformChange: (platform: Platform) => void;
}

export function PlatformRow({ currentPlatform, onPlatformChange }: PlatformRowProps) {
  const dimensions = pixelDimensionsForPlatform(currentPlatform);
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {platforms.map((platform) => {
        const isActive = platform === currentPlatform;
        return (
          <Button
            key={platform}
            size="sm"
            variant={isActive ? 'default' : 'outline'}
            aria-pressed={isActive}
            onClick={() => {
              onPlatformChange(platform);
            }}
          >
            {platformDisplayLabel(platform)}
          </Button>
        );
      })}
      <span className="text-ink-muted tnum ml-2 font-mono text-[11px]">
        {dimensionsLabel(dimensions)}
      </span>
    </div>
  );
}

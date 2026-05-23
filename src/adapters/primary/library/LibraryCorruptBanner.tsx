import { Button } from '@/adapters/primary/app/ui/Button';

import { LIBRARY_CORRUPT_BANNER, messageWithCount } from './LibraryCorruptBanner.strings';

interface LibraryCorruptBannerProps {
  readonly count: number;
  readonly onReport: () => void;
}

export function LibraryCorruptBanner({ count, onReport }: LibraryCorruptBannerProps) {
  if (count === 0) return null;
  return (
    <div className="border-danger/30 bg-danger/10 text-danger flex items-center justify-between gap-3 rounded-md border px-3.5 py-2.5 text-sm">
      <p>{messageWithCount(count)}</p>
      <Button variant="outline" size="sm" onClick={onReport}>
        {LIBRARY_CORRUPT_BANNER.reportButton}
      </Button>
    </div>
  );
}

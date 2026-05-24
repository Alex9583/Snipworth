import type { RenderConfigSnapshot } from '@/domain/rendering/RenderConfig';

import { FULL_TAB_APP } from './FullTabApp.strings';
import { ColumnHeader } from './ui/ColumnHeader';
import { ConfigPanel } from './ui/ConfigPanel';
import { SettingsIcon } from './ui/icons';

interface ConfigColumnProps {
  readonly renderConfig: RenderConfigSnapshot;
  readonly patchConfig: (patch: Partial<RenderConfigSnapshot>) => void;
}

export function ConfigColumn({ renderConfig, patchConfig }: ConfigColumnProps) {
  return (
    <section
      aria-labelledby="config-column-heading"
      className="flex min-h-96 flex-col max-lg:max-h-[60vh] lg:min-h-0 lg:w-1/4 lg:min-w-65"
    >
      <ColumnHeader
        id="config-column-heading"
        icon={<SettingsIcon size={14} />}
        label={FULL_TAB_APP.configColumnLabel}
      />
      <div className="min-h-0 flex-1 overflow-auto px-4 pb-4">
        <ConfigPanel value={renderConfig} onChange={patchConfig} />
      </div>
    </section>
  );
}

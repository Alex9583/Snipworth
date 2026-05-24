import type { ReactNode } from 'react';

import type { DetectionStatus } from '@/application/use-cases/LoadCapturedCode';

import { LiveCodeEditor } from './LiveCodeEditor';
import { SIDE_PANEL_APP } from './SidePanelApp.strings';
import { APP } from './app.strings';
import type { HighlightLookup } from './highlightCache';
import { EditorStats } from './ui/EditorStats';
import { LanguagePicker } from './ui/LanguagePicker';

interface SidePanelCodeTabProps {
  readonly code: string;
  readonly onCodeChange: (next: string) => void;
  readonly language: string;
  readonly detection: DetectionStatus;
  readonly onLanguageChange: (next: string) => void;
  readonly theme: string;
  readonly fontSize: number;
  readonly getHighlight: HighlightLookup;
  readonly saveSlot: ReactNode;
}

export function SidePanelCodeTab({
  code,
  onCodeChange,
  language,
  detection,
  onLanguageChange,
  theme,
  fontSize,
  getHighlight,
  saveSlot,
}: SidePanelCodeTabProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <LiveCodeEditor
        value={code}
        onChange={onCodeChange}
        language={language}
        theme={theme}
        fontSize={fontSize}
        getHighlight={getHighlight}
        label={SIDE_PANEL_APP.tabCodeLabel}
        placeholder={APP.codePlaceholder}
        className="flex-1"
        topRightSlot={
          <LanguagePicker value={language} detection={detection} onChange={onLanguageChange} />
        }
      />
      <div className="flex items-center justify-between">
        <EditorStats code={code} />
        {saveSlot}
      </div>
    </div>
  );
}

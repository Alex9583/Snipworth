import type { ReactNode } from 'react';

import type { DetectionStatus } from '@/application/use-cases/LoadCapturedCode';

import { LiveCodeEditor } from './LiveCodeEditor';
import { SIDE_PANEL_APP } from './SidePanelApp.strings';
import { APP } from './app.strings';
import type { HighlightLookup } from './highlightCache';
import { EditorStats } from './ui/EditorStats';
import { LanguagePicker } from './ui/LanguagePicker';
import { TitleInput } from './ui/TitleInput';

interface SidePanelCodeTabProps {
  readonly title: string;
  readonly onTitleChange: (next: string) => void;
  readonly code: string;
  readonly onCodeChange: (next: string) => void;
  readonly language: string;
  readonly detection: DetectionStatus;
  readonly onLanguageChange: (next: string) => void;
  readonly onAutoDetect: () => void;
  readonly theme: string;
  readonly fontSize: number;
  readonly getHighlight: HighlightLookup;
  readonly saveSlot: ReactNode;
}

export function SidePanelCodeTab({
  title,
  onTitleChange,
  code,
  onCodeChange,
  language,
  detection,
  onLanguageChange,
  onAutoDetect,
  theme,
  fontSize,
  getHighlight,
  saveSlot,
}: SidePanelCodeTabProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <div className="flex items-center gap-2">
        <TitleInput
          value={title}
          onChange={onTitleChange}
          placeholder={SIDE_PANEL_APP.titlePlaceholder}
          label={SIDE_PANEL_APP.titleLabel}
        />
        <LanguagePicker
          value={language}
          detection={detection}
          onChange={onLanguageChange}
          onAutoDetect={onAutoDetect}
        />
      </div>
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
      />
      <div className="flex items-center justify-between">
        <EditorStats code={code} />
        {saveSlot}
      </div>
    </div>
  );
}

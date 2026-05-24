import type { DetectionStatus } from '@/application/use-cases/LoadCapturedCode';

import { FULL_TAB_APP } from './FullTabApp.strings';
import { LiveCodeEditor } from './LiveCodeEditor';
import { APP } from './app.strings';
import type { HighlightLookup } from './highlightCache';
import { ColumnHeader } from './ui/ColumnHeader';
import { EditorStats } from './ui/EditorStats';
import { LanguagePicker } from './ui/LanguagePicker';
import { CodeIcon } from './ui/icons';

interface CodeColumnProps {
  readonly code: string;
  readonly onCodeChange: (next: string) => void;
  readonly language: string;
  readonly detection: DetectionStatus;
  readonly onLanguageChange: (next: string) => void;
  readonly theme: string;
  readonly fontSize: number;
  readonly getHighlight: HighlightLookup;
}

export function CodeColumn({
  code,
  onCodeChange,
  language,
  detection,
  onLanguageChange,
  theme,
  fontSize,
  getHighlight,
}: CodeColumnProps) {
  return (
    <section
      aria-labelledby="code-column-heading"
      className="border-line flex min-h-96 flex-col border-b max-lg:max-h-[60vh] lg:min-h-0 lg:w-1/4 lg:min-w-65 lg:border-r lg:border-b-0"
    >
      <ColumnHeader
        id="code-column-heading"
        icon={<CodeIcon size={14} />}
        label={FULL_TAB_APP.codeColumnLabel}
        slot={<LanguagePicker value={language} detection={detection} onChange={onLanguageChange} />}
      />
      <div className="min-h-0 flex-1 p-3">
        <LiveCodeEditor
          value={code}
          onChange={onCodeChange}
          language={language}
          theme={theme}
          fontSize={fontSize}
          getHighlight={getHighlight}
          label={FULL_TAB_APP.codeColumnLabel}
          placeholder={APP.codePlaceholder}
          className="h-full"
        />
      </div>
      <div className="border-line border-t px-4 py-2">
        <EditorStats code={code} />
      </div>
    </section>
  );
}

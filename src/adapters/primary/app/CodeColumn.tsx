import type { DetectionStatus } from '@/application/use-cases/LoadCapturedCode';

import { FULL_TAB_APP } from './FullTabApp.strings';
import { LiveCodeEditor } from './LiveCodeEditor';
import { APP } from './app.strings';
import type { HighlightLookup } from './highlightCache';
import { EditorStats } from './ui/EditorStats';
import { LanguagePicker } from './ui/LanguagePicker';
import { TitleInput } from './ui/TitleInput';
import { CodeIcon } from './ui/icons';

interface CodeColumnProps {
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
}

export function CodeColumn({
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
}: CodeColumnProps) {
  return (
    <section
      aria-labelledby="code-column-heading"
      className="border-line flex min-h-96 flex-col border-b max-lg:max-h-[60vh] lg:min-h-0 lg:w-1/4 lg:min-w-65 lg:border-r lg:border-b-0"
    >
      <div className="border-line flex items-center gap-2 border-b px-4 py-3">
        <h2
          id="code-column-heading"
          className="text-ink flex shrink-0 items-center gap-2 text-sm font-semibold"
        >
          <span className="text-ink-muted">
            <CodeIcon size={14} />
          </span>
          {FULL_TAB_APP.codeColumnLabel}
        </h2>
        <TitleInput
          value={title}
          onChange={onTitleChange}
          placeholder={FULL_TAB_APP.titlePlaceholder}
          label={FULL_TAB_APP.titleLabel}
        />
        <LanguagePicker
          value={language}
          detection={detection}
          onChange={onLanguageChange}
          onAutoDetect={onAutoDetect}
        />
      </div>
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

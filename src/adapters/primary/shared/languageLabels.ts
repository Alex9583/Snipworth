import type { SupportedLanguage } from '@/domain/syntax-highlighting/SupportedLanguages';

type LabelledLanguage = SupportedLanguage | 'plaintext';

const LANGUAGE_LABELS: Readonly<Record<LabelledLanguage, string>> = {
  'plaintext': 'Plain Text',
  'bash': 'Bash',
  'c': 'C',
  'cpp': 'C++',
  'csharp': 'C#',
  'css': 'CSS',
  'diff': 'Diff',
  'go': 'Go',
  'graphql': 'GraphQL',
  'html': 'HTML',
  'ini': 'INI',
  'java': 'Java',
  'javascript': 'JavaScript',
  'json': 'JSON',
  'jsx': 'JSX',
  'kotlin': 'Kotlin',
  'less': 'Less',
  'lua': 'Lua',
  'makefile': 'Makefile',
  'markdown': 'Markdown',
  'objective-c': 'Objective-C',
  'perl': 'Perl',
  'php': 'PHP',
  'python': 'Python',
  'r': 'R',
  'ruby': 'Ruby',
  'rust': 'Rust',
  'scss': 'SCSS',
  'shell': 'Shell',
  'sql': 'SQL',
  'swift': 'Swift',
  'tsx': 'TSX',
  'typescript': 'TypeScript',
  'vb': 'Visual Basic',
  'wasm': 'WebAssembly',
  'xml': 'XML',
  'yaml': 'YAML',
};

export function languageDisplayLabel(id: string): string {
  if (Object.hasOwn(LANGUAGE_LABELS, id)) {
    return LANGUAGE_LABELS[id as LabelledLanguage];
  }
  return id;
}

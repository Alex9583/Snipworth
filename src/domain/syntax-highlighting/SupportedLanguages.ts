export const SUPPORTED_LANGUAGES = [
  'bash',
  'c',
  'cpp',
  'csharp',
  'css',
  'diff',
  'go',
  'graphql',
  'html',
  'ini',
  'java',
  'javascript',
  'json',
  'jsx',
  'kotlin',
  'less',
  'lua',
  'makefile',
  'markdown',
  'objective-c',
  'perl',
  'php',
  'python',
  'r',
  'ruby',
  'rust',
  'scss',
  'shell',
  'sql',
  'swift',
  'tsx',
  'typescript',
  'vb',
  'wasm',
  'xml',
  'yaml',
] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const LANGUAGE_ALIASES = {
  'objectivec': 'objective-c',
  'vbnet': 'vb',
  'php-template': 'php',
  'python-repl': 'python',
} as const satisfies Readonly<Record<string, SupportedLanguage>>;

export const PICKER_LANGUAGES = [
  'plaintext',
  'typescript',
  'javascript',
  'jsx',
  'tsx',
  'python',
  'rust',
  'go',
  'java',
  'cpp',
  'json',
  'html',
  'css',
  'bash',
  'sql',
  'markdown',
  'yaml',
] as const;

export function isSupportedLanguage(name: string): name is SupportedLanguage {
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(name);
}

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
  'java',
  'csharp',
  'cpp',
  'c',
  'go',
  'rust',
  'ruby',
  'php',
  'swift',
  'kotlin',
  'shell',
  'bash',
  'sql',
  'json',
  'yaml',
  'html',
  'css',
  'scss',
  'less',
  'markdown',
  'graphql',
  'xml',
  'lua',
  'perl',
  'r',
  'objective-c',
  'diff',
  'ini',
  'makefile',
  'vb',
  'wasm',
] as const satisfies readonly (SupportedLanguage | 'plaintext')[];

export function isSupportedLanguage(name: string): name is SupportedLanguage {
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(name);
}

export function canonicalLanguage(name: string): string {
  if (Object.hasOwn(LANGUAGE_ALIASES, name)) {
    return LANGUAGE_ALIASES[name as keyof typeof LANGUAGE_ALIASES];
  }
  return name;
}

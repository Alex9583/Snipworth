import { createBundledHighlighter, type HighlighterGeneric } from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';

import type { HighlightedCode, SyntaxHighlighter } from '@/application/ports/SyntaxHighlighter';
import {
  LANGUAGE_ALIASES,
  isSupportedLanguage,
  type SupportedLanguage,
} from '@/domain/syntax-highlighting/SupportedLanguages';

type BundledTheme = 'github-dark' | 'github-light';

const LANGUAGE_LOADERS = {
  'bash': () => import('@shikijs/langs/bash'),
  'c': () => import('@shikijs/langs/c'),
  'cpp': () => import('@shikijs/langs/cpp'),
  'csharp': () => import('@shikijs/langs/csharp'),
  'css': () => import('@shikijs/langs/css'),
  'diff': () => import('@shikijs/langs/diff'),
  'go': () => import('@shikijs/langs/go'),
  'graphql': () => import('@shikijs/langs/graphql'),
  'html': () => import('@shikijs/langs/html'),
  'ini': () => import('@shikijs/langs/ini'),
  'java': () => import('@shikijs/langs/java'),
  'javascript': () => import('@shikijs/langs/javascript'),
  'json': () => import('@shikijs/langs/json'),
  'jsx': () => import('@shikijs/langs/jsx'),
  'kotlin': () => import('@shikijs/langs/kotlin'),
  'less': () => import('@shikijs/langs/less'),
  'lua': () => import('@shikijs/langs/lua'),
  'makefile': () => import('@shikijs/langs/makefile'),
  'markdown': () => import('@shikijs/langs/markdown'),
  'objective-c': () => import('@shikijs/langs/objective-c'),
  'perl': () => import('@shikijs/langs/perl'),
  'php': () => import('@shikijs/langs/php'),
  'python': () => import('@shikijs/langs/python'),
  'r': () => import('@shikijs/langs/r'),
  'ruby': () => import('@shikijs/langs/ruby'),
  'rust': () => import('@shikijs/langs/rust'),
  'scss': () => import('@shikijs/langs/scss'),
  'shell': () => import('@shikijs/langs/shell'),
  'sql': () => import('@shikijs/langs/sql'),
  'swift': () => import('@shikijs/langs/swift'),
  'tsx': () => import('@shikijs/langs/tsx'),
  'typescript': () => import('@shikijs/langs/typescript'),
  'vb': () => import('@shikijs/langs/vb'),
  'wasm': () => import('@shikijs/langs/wasm'),
  'xml': () => import('@shikijs/langs/xml'),
  'yaml': () => import('@shikijs/langs/yaml'),
} as const satisfies Record<SupportedLanguage, () => Promise<unknown>>;

const THEME_LOADERS = {
  'github-dark': () => import('@shikijs/themes/github-dark'),
  'github-light': () => import('@shikijs/themes/github-light'),
} as const satisfies Record<BundledTheme, () => Promise<unknown>>;

const CORE_LANGUAGES = [
  'typescript',
  'javascript',
  'python',
] as const satisfies readonly SupportedLanguage[];
const CORE_THEMES = ['github-dark', 'github-light'] as const satisfies readonly BundledTheme[];

const FALLBACK_LANGUAGE = 'text';
const FALLBACK_THEME: BundledTheme = 'github-dark';

const createHighlighter = createBundledHighlighter<SupportedLanguage, BundledTheme>({
  langs: LANGUAGE_LOADERS,
  themes: THEME_LOADERS,
  engine: () => createJavaScriptRegexEngine(),
});

type Highlighter = HighlighterGeneric<SupportedLanguage, BundledTheme>;

export class ShikiSyntaxHighlighter implements SyntaxHighlighter {
  private highlighterPromise: Promise<Highlighter> | null = null;

  async highlight(code: string, language: string, theme: string): Promise<HighlightedCode> {
    const highlighter = await this.getHighlighter();
    const resolvedLanguage = resolveLanguage(language);
    const resolvedTheme = isBundledTheme(theme) ? theme : FALLBACK_THEME;

    if (
      resolvedLanguage !== FALLBACK_LANGUAGE &&
      !isLanguageLoaded(highlighter, resolvedLanguage)
    ) {
      await highlighter.loadLanguage(canonicalLanguage(resolvedLanguage));
    }
    if (!highlighter.getLoadedThemes().includes(resolvedTheme)) {
      await highlighter.loadTheme(resolvedTheme);
    }

    const hast = highlighter.codeToHast(code, {
      lang: resolvedLanguage,
      theme: resolvedTheme,
    });
    return { hast, resolvedLanguage, resolvedTheme };
  }

  private getHighlighter(): Promise<Highlighter> {
    this.highlighterPromise ??= createHighlighter({
      langs: [...CORE_LANGUAGES],
      themes: [...CORE_THEMES],
      langAlias: LANGUAGE_ALIASES,
    });
    return this.highlighterPromise;
  }
}

function resolveLanguage(name: string): string {
  if (isSupportedLanguage(name)) return name;
  if (name in LANGUAGE_ALIASES) return name;
  return FALLBACK_LANGUAGE;
}

function canonicalLanguage(name: string): SupportedLanguage {
  const aliased = (LANGUAGE_ALIASES as Readonly<Record<string, SupportedLanguage>>)[name];
  return aliased ?? (name as SupportedLanguage);
}

function isLanguageLoaded(highlighter: Highlighter, name: string): boolean {
  return highlighter.getLoadedLanguages().includes(canonicalLanguage(name));
}

function isBundledTheme(name: string): name is BundledTheme {
  return name in THEME_LOADERS;
}

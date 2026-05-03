import {
  bundledLanguages,
  bundledThemes,
  createHighlighter,
  createJavaScriptRegexEngine,
  type BundledLanguage,
  type BundledTheme,
  type Highlighter,
} from 'shiki';

import type { SyntaxHighlighter } from '@/application/ports/SyntaxHighlighter';
import type { HighlightedCode } from '@/domain/syntax-highlighting/HighlightedCode';

const CORE_LANGUAGES = [
  'typescript',
  'javascript',
  'python',
] as const satisfies readonly BundledLanguage[];
const CORE_THEMES = ['github-dark', 'github-light'] as const satisfies readonly BundledTheme[];

const FALLBACK_LANGUAGE = 'text' as const;
const FALLBACK_THEME = 'github-dark' as const satisfies BundledTheme;

export class ShikiSyntaxHighlighter implements SyntaxHighlighter {
  private highlighterPromise: Promise<Highlighter> | null = null;

  async highlight(code: string, language: string, theme: string): Promise<HighlightedCode> {
    const highlighter = await this.getHighlighter();

    const resolvedLanguage = isBundledLanguage(language) ? language : FALLBACK_LANGUAGE;
    const resolvedTheme = isBundledTheme(theme) ? theme : FALLBACK_THEME;

    if (
      resolvedLanguage !== FALLBACK_LANGUAGE &&
      !highlighter.getLoadedLanguages().includes(resolvedLanguage)
    ) {
      await highlighter.loadLanguage(resolvedLanguage);
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
      engine: createJavaScriptRegexEngine(),
    });
    return this.highlighterPromise;
  }
}

function isBundledLanguage(name: string): name is BundledLanguage {
  return name in bundledLanguages;
}

function isBundledTheme(name: string): name is BundledTheme {
  return name in bundledThemes;
}

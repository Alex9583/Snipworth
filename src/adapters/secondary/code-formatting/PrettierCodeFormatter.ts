import type { Plugin } from 'prettier';

import type { CodeFormatter, FormatOutcome } from '@/application/ports/CodeFormatter';
import type { SupportedLanguage } from '@/domain/syntax-highlighting/SupportedLanguages';

type PrettierStandalone = typeof import('prettier/standalone');

const PLUGIN_LOADERS = {
  babel: () => import('prettier/plugins/babel'),
  estree: () => import('prettier/plugins/estree'),
  typescript: () => import('prettier/plugins/typescript'),
  postcss: () => import('prettier/plugins/postcss'),
  html: () => import('prettier/plugins/html'),
  markdown: () => import('prettier/plugins/markdown'),
  yaml: () => import('prettier/plugins/yaml'),
  graphql: () => import('prettier/plugins/graphql'),
} as const satisfies Record<string, () => Promise<unknown>>;

type PluginName = keyof typeof PLUGIN_LOADERS;

interface FormatterSpec {
  readonly parser: string;
  readonly plugins: readonly PluginName[];
}

const FORMATTER_BY_LANGUAGE = {
  javascript: { parser: 'babel', plugins: ['babel', 'estree'] },
  jsx: { parser: 'babel', plugins: ['babel', 'estree'] },
  typescript: { parser: 'typescript', plugins: ['typescript', 'estree'] },
  tsx: { parser: 'typescript', plugins: ['typescript', 'estree'] },
  json: { parser: 'json', plugins: ['babel', 'estree'] },
  css: { parser: 'css', plugins: ['postcss'] },
  scss: { parser: 'scss', plugins: ['postcss'] },
  less: { parser: 'less', plugins: ['postcss'] },
  html: { parser: 'html', plugins: ['html'] },
  markdown: { parser: 'markdown', plugins: ['markdown'] },
  yaml: { parser: 'yaml', plugins: ['yaml'] },
  graphql: { parser: 'graphql', plugins: ['graphql'] },
} as const satisfies Partial<Record<SupportedLanguage, FormatterSpec>>;

export class PrettierCodeFormatter implements CodeFormatter {
  private standalonePromise: Promise<PrettierStandalone> | null = null;

  supports(language: string): boolean {
    return Object.hasOwn(FORMATTER_BY_LANGUAGE, language);
  }

  async format(code: string, language: string): Promise<FormatOutcome> {
    const spec = (FORMATTER_BY_LANGUAGE as Readonly<Record<string, FormatterSpec>>)[language];
    if (spec === undefined) {
      return {
        kind: 'failed',
        cause: new Error(`No Prettier formatter for language "${language}"`),
      };
    }

    const [standalone, plugins] = await Promise.all([
      this.loadStandalone(),
      Promise.all(spec.plugins.map((name) => PLUGIN_LOADERS[name]() as Promise<Plugin>)),
    ]);

    try {
      const formatted = await standalone.format(code, { parser: spec.parser, plugins });
      return { kind: 'formatted', code: formatted };
    } catch (cause) {
      return { kind: 'failed', cause };
    }
  }

  private loadStandalone(): Promise<PrettierStandalone> {
    this.standalonePromise ??= import('prettier/standalone');
    return this.standalonePromise;
  }
}

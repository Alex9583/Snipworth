import { fileURLToPath } from 'node:url';
import { includeIgnoreFile } from '@eslint/compat';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

const gitignorePath = fileURLToPath(new URL('.gitignore', import.meta.url));

export default tseslint.config(
  includeIgnoreFile(gitignorePath, 'Imported .gitignore patterns'),

  { settings: { react: { version: 'detect' } } },

  js.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  { files: ['**/*.{jsx,tsx}'], ...react.configs.flat.recommended },
  { files: ['**/*.{jsx,tsx}'], ...react.configs.flat['jsx-runtime'] },
  { files: ['**/*.{jsx,tsx}'], ...jsxA11y.flatConfigs.recommended },

  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
      globals: { ...globals.browser },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'all',
          argsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
    },
  },

  {
    files: [
      'vite.config.ts',
      'vitest.config.ts',
      'playwright.config.ts',
      'eslint.config.js',
      'manifest.config.ts',
    ],
    languageOptions: { globals: { ...globals.node } },
  },

  {
    files: [
      'src/adapters/primary/background/**/*.ts',
      'src/infrastructure/bootstrap/composeBackground.ts',
    ],
    languageOptions: { globals: { ...globals.serviceworker } },
  },

  {
    files: ['src/application/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['@/adapters/**'], message: 'application must not import adapters' },
            {
              group: ['@/infrastructure/**'],
              message: 'application must not import infrastructure',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/application/ports/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['@/adapters/**'], message: 'ports must not import adapters' },
            { group: ['@/infrastructure/**'], message: 'ports must not import infrastructure' },
            { group: ['@/application/use-cases/**'], message: 'ports must not import use-cases' },
          ],
        },
      ],
    },
  },
  {
    files: ['src/domain/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['@/adapters/**'], message: 'domain must not import adapters' },
            { group: ['@/infrastructure/**'], message: 'domain must not import infrastructure' },
            { group: ['@/application/**'], message: 'domain must not import application' },
          ],
        },
      ],
    },
  },

  {
    files: ['**/*.{js,mjs,cjs}'],
    extends: [tseslint.configs.disableTypeChecked],
  },

  prettier,
);

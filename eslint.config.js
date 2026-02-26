import { defineConfig, globalIgnores } from 'eslint/config';
import js from '@eslint/js';
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript';
import importX from 'eslint-plugin-import-x';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import ts from 'typescript-eslint';

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      ts.configs.recommended,
      importX.flatConfigs.recommended,
      importX.flatConfigs.typescript,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    settings: {
      'import-x/resolver-next': [createTypeScriptImportResolver()],
    },
    rules: {
      'import-x/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            ['parent', 'sibling'],
            'index',
            'type',
            'unknown', // CSS imports go here at the very end
          ],
          pathGroups: [
            // CSS imports - grouped at the very end in "unknown" group
            // Multiple patterns needed to match all CSS import path styles
            // Note: If specific CSS order is needed, use eslint-disable-next-line import-x/order
            {
              pattern: './*.css',
              group: 'unknown',
            },
            {
              pattern: './*.module.css',
              group: 'unknown',
            },
            {
              pattern: '../**/*.css',
              group: 'unknown',
            },
            {
              pattern: '../**/*.module.css',
              group: 'unknown',
            },
            {
              pattern: '**/*.css',
              group: 'unknown',
            },
            {
              pattern: '**/*.module.css',
              group: 'unknown',
            },
            {
              pattern: 'react',
              group: 'external',
              position: 'before',
            },
            {
              pattern: '@/**',
              group: 'internal',
            },
          ],
          pathGroupsExcludedImportTypes: ['type'],
          'newlines-between': 'always',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
          warnOnUnassignedImports: true,
        },
      ],
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
]);

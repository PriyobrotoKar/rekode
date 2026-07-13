import js from '@eslint/js';
import tseslint from 'typescript-eslint';

import { config as baseConfig } from './base.js';

export const config = [
  ...baseConfig,
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
        parserOptions: {
        projectService: {
            allowDefaultProject: ['eslint.config.mjs']
          },
        },
      },
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/no-unused-vars': 'error',
      'no-console': 'error',
    },
  },
];

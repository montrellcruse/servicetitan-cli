import js from '@eslint/js'
import tseslint from '@typescript-eslint/eslint-plugin'
import globals from 'globals'

const typescriptFiles = ['src/**/*.ts', 'test/**/*.ts']

export default [
  {
    ignores: ['coverage/**', 'dist/**'],
  },
  {
    ...js.configs.recommended,
    files: typescriptFiles,
  },
  ...tseslint.configs['flat/recommended-type-checked'].map((config) => ({
    ...config,
    files: typescriptFiles,
  })),
  {
    files: typescriptFiles,
    languageOptions: {
      globals: globals.node,
      parserOptions: {
        project: './tsconfig.eslint.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
        },
      ],
    },
  },
]

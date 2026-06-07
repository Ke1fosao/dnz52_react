import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default tseslint.config(
  // Ігноруємо папки, які не треба перевіряти
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      '**/*.js',          // конфіги на JS (postcss, tailwind тощо) не перевіряємо
      'vite.config.d.ts',
    ],
  },

  // Базові правила JS
  js.configs.recommended,

  // TypeScript
  ...tseslint.configs.recommended,

  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
    },
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      // React Hooks — тільки основні правила
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // Вимикаємо суворі правила що спрацьовують на легітимний існуючий код
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/static-components': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/refs': 'off',

      // Дозволяємо порожні функції
      '@typescript-eslint/no-empty-function': 'off',

      // any — у великому проєкті зустрічається легітимно
      '@typescript-eslint/no-explicit-any': 'warn',

      // Невикористані змінні — warn, а не error
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'no-unused-vars': 'off',

      // Знижуємо до warn для legacy коду
      'no-useless-assignment': 'warn',
      'no-constant-binary-expression': 'warn',
      'prefer-rest-params': 'warn',
    },
  },
);

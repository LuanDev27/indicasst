import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'coverage', '.specify', 'node_modules'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
    },
  },
  {
    // Princípio I — NÚCLEO PURO. O core não conhece a camada visual.
    files: ['src/core/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'react',
              message:
                'src/core/ é núcleo puro: nenhuma lógica de cálculo importa React (constituição, princípio I).',
            },
            {
              name: 'react-dom',
              message: 'src/core/ é núcleo puro (constituição, princípio I).',
            },
            {
              name: 'recharts',
              message:
                'Gráficos recebem dados já calculados; o core não desenha nada (constituição, princípio I).',
            },
          ],
        },
      ],
    },
  },
  {
    // Princípio IX — a política de animação mora nos wrappers de gráfico.
    files: ['src/features/**/*.tsx'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'JSXAttribute[name.name="isAnimationActive"]',
          message:
            'A política de animação é centralizada em src/components/graficos/ (constituição, princípio IX).',
        },
      ],
    },
  },
);

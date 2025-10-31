import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import complexity from "eslint-plugin-complexity";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    plugins: {
      complexity
    },
    rules: {
      // TypeScript 严格规则 - 禁止any类型、要求返回类型、严格空值检查
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/prefer-const': 'error',
      '@typescript-eslint/no-inferrable-types': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/explicit-function-return-type': 'error',
      '@typescript-eslint/explicit-module-boundary-types': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/strict-boolean-expressions': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      
      // 额外严格的TypeScript规则
      '@typescript-eslint/no-unnecessary-condition': 'error',
      '@typescript-eslint/prefer-readonly': 'warn',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/require-await': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-for-in-array': 'error',
      '@typescript-eslint/unified-signatures': 'warn',
      
      // 通用代码质量规则
      'no-console': 'warn',
      'no-debugger': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      'object-shorthand': 'error',
      'prefer-template': 'error',
      'template-curly-spacing': 'error',
      'arrow-spacing': 'error',
      'comma-dangle': 'error',
      'comma-spacing': 'error',
      'comma-style': 'error',
      'computed-property-spacing': 'error',
      'func-call-spacing': 'error',
      'indent': ['error', 2],
      'key-spacing': 'error',
      'keyword-spacing': 'error',
      'max-len': ['warn', { 'code': 120 }],
      'no-multiple-empty-lines': 'error',
      'no-trailing-spaces': 'error',
      'object-curly-spacing': 'error',
      'quotes': ['error', 'single'],
      'semi': 'error',
      'space-before-blocks': 'error',
      'space-in-parens': 'error',
      'space-infix-ops': 'error',
      
      // 代码复杂度检查
      'complexity': ['error', { 'max': 10 }],
      'max-depth': ['error', 4],
      'max-params': ['error', 4],
      'max-statements': ['error', 20],
      'max-lines': ['error', { 'max': 200, 'skipBlankLines': true, 'skipComments': true }],
      
      // 代码安全检查
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-script-url': 'error',
      'no-alert': 'warn',
      'no-useless-catch': 'error',
      'no-return-assign': 'error',
      'no-self-compare': 'error',
      'no-sequences': 'error',
      
      // 性能检查
      'no-loop-func': 'error',
      'prefer-arrow-callback': 'error',
      'prefer-rest-params': 'error',
      'prefer-spread': 'error'
    }
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "node_modules/**",
    "dist/**",
    "coverage/**",
    "prisma/generated/**"
  ]),
]);

export default eslintConfig;

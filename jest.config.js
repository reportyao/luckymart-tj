/**
 * Jest配置文件
 * 适用于LuckyMart TJ项目的完整测试套件
 */

const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    // Handle module aliases (this matches the tsconfig.json paths)
    '^@/(.*)$': '<rootDir>/$1',
  },
  testEnvironment: 'node',

  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  },
  coverageDirectory: '<rootDir>/test-results/coverage',
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov',
    'json',
    'clover'
  ],
  collectCoverageFrom: [
    'lib/**/*.{ts,tsx}',
    'app/api/**/*.{ts,tsx}',
    'bot/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    'contexts/**/*.{ts,tsx}',
    'hooks/**/*.{ts,tsx}',
    'scripts/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/coverage/**',
    '!**/test-results/**',
    '!**/jest.config.js',
    '!**/jest.setup.js',
    '!**/__tests__/**'
  ],
  testMatch: [
    '<rootDir>/__tests__/**/*.{test,spec}.{js,ts,tsx}',
    '<rootDir>/test/**/*.{test,spec}.{js,ts,tsx}',
    '<rootDir>/!**/__tests__/**/*.{test,spec}.{js,ts,tsx}'
  ],
  testTimeout: 30000,
  verbose: true,
  maxWorkers: '50%',
  detectOpenHandles: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);
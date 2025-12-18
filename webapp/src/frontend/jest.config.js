/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\.(ts|tsx|js|jsx)$': 'babel-jest',
  },
  testMatch: ['**/**/*.spec.ts', '**/**/*.spec.tsx'],
  moduleNameMapper: {
    '\.css$': '<rootDir>/__mocks__/styleMock.js',
  },
};

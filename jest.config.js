/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  roots: ['<rootDir>/test'],
  preset: 'ts-jest',
  testEnvironment: 'node',
  collectCoverage: true,
  coverageDirectory: 'coverage',
  testPathIgnorePatterns: ['/node_modules/'],
  // transform: {
  //   "^.+\\.(js|ts|tsx)$": "ts-jest"
  // },
  //collectCoverageFrom: ['./src/**/*.ts', "!src/**.*.d.ts"]
};
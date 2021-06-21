module.exports = {
  preset: 'ts-jest',
  roots: ['<rootDir>'],
  testEnvironment: 'node',
  collectCoverage: true,
  coveragePathIgnorePatterns: [
    '<rootDir>/build/',
    '<rootDir>/dist/',
    '<rootDir>/node_modules/'
  ],
  coverageDirectory: '<rootDir>/coverage/',
  verbose: true
}

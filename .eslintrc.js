module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint'
    // 'jest'
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier',
    'prettier/@typescript-eslint'
    // 'plugin:node/recommended',
    // 'plugin:jest/recommended'
  ],

  // parser: 'babel-eslint',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module'
  },
  // plugins: ['node', 'jest'],
  env: {
    'jest/globals': true,
    es6: true,
    node: true
  },
  rules: {
    // As CLI tool, we want to take care of exit codes and error output on our own
    'no-process-exit': 0,
    'no-console': 0,
    // We have babel now
    'node/no-unsupported-features': 0,
    'node/no-unsupported-features/es-syntax': 0
  }
}

module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'jest'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier',
    'plugin:jest/recommended'
  ],

  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module'
  },

  env: {
    'jest/globals': true,
    es6: true,
    node: true
  },
  rules: {
    // As CLI tool, we want to take care of exit codes and error output on our own
    'no-process-exit': 0,
    'no-console': 0
  }
}

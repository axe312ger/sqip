module.exports = {
  parser: 'babel-eslint',
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module'
  },
  plugins: ['node', 'jest'],
  extends: [
    'eslint:recommended',
    'plugin:node/recommended',
    'plugin:jest/recommended'
  ],
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

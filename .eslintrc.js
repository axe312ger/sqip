module.exports = {
  parser: 'babel-eslint',
  parserOptions: { ecmaVersion: 2018 },
  plugins: ['node', 'jest'],
  extends: [
    'prettier-standard',
    'plugin:node/recommended',
    'plugin:jest/recommended'
  ],
  env: {
    'jest/globals': true
  },
  rules: {
    // As CLI tool, we want to take care of exit codes and error output on our own
    'no-process-exit': 0,
    // We have babel now
    'node/no-unsupported-features': 0,
    'node/no-unsupported-features/es-syntax': 0
  }
}

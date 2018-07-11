module.exports = {
  parserOptions: { ecmaVersion: 2018 },
  plugins: ['node'],
  extends: ['prettier-standard', 'plugin:node/recommended'],
  rules: {
    // As CLI tool, we want to take care of exit codes and error output on our own
    'no-process-exit': 0,
    // For babel-polyfill
    'node/no-extraneous-require': 0
  }
}

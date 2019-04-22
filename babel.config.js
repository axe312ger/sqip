const IS_TEST = process.env.NODE_ENV !== `test`
const ignore = ['**/dist']

if (IS_TEST) {
  ignore.push('**/__tests__')
}

module.exports = {
  sourceMaps: true,
  ignore,
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          node: '8'
        }
      }
    ]
  ],
  plugins: [!IS_TEST && 'add-module-exports'].filter(Boolean)
}

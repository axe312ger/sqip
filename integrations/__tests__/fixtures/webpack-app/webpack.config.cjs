const path = require('path')

module.exports = {
  mode: 'production',
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    library: { type: 'commonjs2' }
  },
  module: {
    rules: [
      {
        test: /\.(jpe?g|png|gif|webp|avif|tiff?)$/i,
        use: [
          {
            loader: 'sqip-loader',
            options: {
              plugins: [
                { name: 'primitive', options: { numberOfPrimitives: 4, mode: 0 } },
                'blur',
                'svgo',
                'data-uri'
              ],
              width: 300
            }
          }
        ]
      }
    ]
  }
}

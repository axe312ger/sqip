/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack(config) {
    config.module.rules.push({
      test: /\.(jpg|jpeg|png|gif|webp)$/,
      resourceQuery: /sqip/,
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
            width: 128
          }
        }
      ]
    })
    return config
  }
}

export default nextConfig

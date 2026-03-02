import { defineConfig } from 'astro/config'
import sqipPlugin from 'vite-plugin-sqip'

export default defineConfig({
  vite: {
    plugins: [
      sqipPlugin({
        plugins: [
          { name: 'primitive', options: { numberOfPrimitives: 4, mode: 0 } },
          'blur',
          'svgo',
          'data-uri'
        ],
        width: 128
      })
    ]
  }
})

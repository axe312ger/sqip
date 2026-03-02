import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    include: [
      'packages/**/__tests__/**/*.test.ts',
      'integrations/**/__tests__/**/*.test.ts'
    ],
    exclude: ['**/*.integration.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['packages/*/src/**/*.ts', 'integrations/*/src/**/*.ts'],
      exclude: ['packages/*/dist/**', 'integrations/*/dist/**', '**/wrapper.ts']
    },
    typecheck: {
      tsconfig: './tsconfig.json'
    }
  }
})

import { describe, test, expect, beforeAll } from 'vitest'
import { execSync } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fixtureDir = path.resolve(__dirname, 'fixtures/astro-app')

describe('vite-plugin-sqip Astro integration', () => {
  beforeAll(() => {
    // Install dependencies for the fixture app
    execSync('npm install', {
      cwd: fixtureDir,
      stdio: 'pipe',
      timeout: 120_000
    })
  })

  test('astro build succeeds with vite-plugin-sqip', () => {
    execSync('npx astro build', {
      cwd: fixtureDir,
      stdio: 'pipe',
      timeout: 120_000,
      env: { ...process.env, NODE_ENV: 'production' }
    })

    // Build should complete — if it throws, the test fails
    const distDir = path.join(fixtureDir, 'dist')
    expect(fs.existsSync(distDir)).toBe(true)
  })

  test('build output contains sqip placeholder data', () => {
    const distDir = path.join(fixtureDir, 'dist')

    // Find HTML files in the build output
    const findSqipData = (dir: string): boolean => {
      const entries = fs.readdirSync(dir, { withFileTypes: true })
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)
        if (entry.isDirectory()) {
          if (findSqipData(fullPath)) return true
        } else if (
          entry.name.endsWith('.html') ||
          entry.name.endsWith('.js')
        ) {
          const content = fs.readFileSync(fullPath, 'utf-8')
          if (content.includes('dataURI') && content.includes('svg')) {
            return true
          }
        }
      }
      return false
    }

    expect(findSqipData(distDir)).toBe(true)
  })
})

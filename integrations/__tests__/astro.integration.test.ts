import { describe, test, expect, beforeAll } from 'vitest'
import { execSync } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fixtureDir = path.resolve(__dirname, 'fixtures/astro-app')
const distDir = path.join(fixtureDir, 'dist')

describe('vite-plugin-sqip Astro integration', () => {
  beforeAll(() => {
    // Clean previous build artifacts
    fs.rmSync(distDir, { recursive: true, force: true })

    // Install dependencies for the fixture app
    execSync('npm install', {
      cwd: fixtureDir,
      stdio: 'pipe',
      timeout: 120_000
    })

    // Run the build once for all tests
    execSync('npx astro build', {
      cwd: fixtureDir,
      stdio: 'pipe',
      timeout: 120_000,
      env: { ...process.env, NODE_ENV: 'production' }
    })
  })

  test('astro build succeeds with vite-plugin-sqip', () => {
    expect(fs.existsSync(distDir)).toBe(true)
  })

  test('build output contains sqip placeholder data', () => {
    // Find HTML or JS files in the build output
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

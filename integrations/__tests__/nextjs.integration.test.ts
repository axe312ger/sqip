import { describe, test, expect, beforeAll } from 'vitest'
import { execSync } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fixtureDir = path.resolve(__dirname, 'fixtures/nextjs-app')
const buildDir = path.join(fixtureDir, '.next')

describe('sqip-loader Next.js integration', () => {
  beforeAll(() => {
    // Clean previous build artifacts
    fs.rmSync(buildDir, { recursive: true, force: true })

    // Install dependencies for the fixture app
    execSync('npm install', {
      cwd: fixtureDir,
      stdio: 'pipe',
      timeout: 120_000
    })

    // Run the build once for all tests
    execSync('npx next build', {
      cwd: fixtureDir,
      stdio: 'pipe',
      timeout: 120_000,
      env: { ...process.env, NODE_ENV: 'production' }
    })
  })

  test('next build succeeds with sqip-loader', () => {
    expect(fs.existsSync(buildDir)).toBe(true)
  })

  test('build output contains sqip placeholder data', () => {
    const serverDir = path.join(buildDir, 'server')
    expect(fs.existsSync(serverDir)).toBe(true)

    // Find any JS/HTML files in the build that contain our sqip output
    const findSqipData = (dir: string): boolean => {
      const entries = fs.readdirSync(dir, { withFileTypes: true })
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)
        if (entry.isDirectory()) {
          if (findSqipData(fullPath)) return true
        } else if (entry.name.endsWith('.js') || entry.name.endsWith('.html')) {
          const content = fs.readFileSync(fullPath, 'utf-8')
          if (content.includes('dataURI') && content.includes('svg')) {
            return true
          }
        }
      }
      return false
    }

    expect(findSqipData(buildDir)).toBe(true)
  })
})

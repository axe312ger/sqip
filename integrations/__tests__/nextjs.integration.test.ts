import { describe, test, expect, beforeAll } from 'vitest'
import { execSync } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fixtureDir = path.resolve(__dirname, 'fixtures/nextjs-app')

describe('sqip-loader Next.js integration', () => {
  beforeAll(() => {
    // Install dependencies for the fixture app
    execSync('npm install', {
      cwd: fixtureDir,
      stdio: 'pipe',
      timeout: 120_000
    })
  })

  test('next build succeeds with sqip-loader', () => {
    const result = execSync('npx next build', {
      cwd: fixtureDir,
      stdio: 'pipe',
      timeout: 120_000,
      env: { ...process.env, NODE_ENV: 'production' }
    })

    const output = result.toString()

    // Build should complete successfully
    expect(output).toContain('Collecting page data')
  })

  test('build output contains sqip placeholder data', () => {
    // Check that the build output directory exists
    const buildDir = path.join(fixtureDir, '.next')
    expect(fs.existsSync(buildDir)).toBe(true)

    // Search for sqip data in the build output
    const serverDir = path.join(buildDir, 'server')
    expect(fs.existsSync(serverDir)).toBe(true)

    // Find any JS files in the build that contain our sqip output
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

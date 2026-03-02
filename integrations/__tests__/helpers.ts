import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export const FIXTURES_DIR = path.resolve(__dirname, 'fixtures')
export const TEST_IMAGE = path.resolve(__dirname, '../../__tests__/fixtures/beach.jpg')
export const PROJECT_ROOT = path.resolve(__dirname, '../..')

export function copyTestImage(destDir: string, filename = 'beach.jpg'): string {
  const dest = path.join(destDir, filename)
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(path.dirname(dest), { recursive: true })
    fs.copyFileSync(TEST_IMAGE, dest)
  }
  return dest
}

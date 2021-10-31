const { execSync } = require('child_process')
const { existsSync } = require('fs')
const { resolve } = require('path')

const builds = [
  {
    os: 'darwin',
    arch: 'amd64',
    filename: 'primitive-darwin-x64'
  },
  {
    os: 'linux',
    arch: 'amd64',
    filename: 'primitive-linux-x64'
  },
  {
    os: 'windows',
    arch: 'amd64',
    filename: 'primitive-win32-x64.exe'
  }
]

try {
  // Get primitive
  execSync(`go install github.com/hashbite/primitive@latest`)
} catch (err) {
  console.log('\n---\n\nUnable to download and build primitive from https://github.com/hashbite/primitive.\n\nIs go installed?\n\nSome users might just want to download it from here: https://golang.org/dl/\n\nBrew users: brew install go\n\n---\n\n')
  process.exit(1)
}

// Build executables
builds.forEach(build => {
  const { os, arch, filename } = build
  const path = resolve(__dirname, '..', 'primitive-binaries', filename)
  if (existsSync(path)) {
    console.log(`Primitive executable for ${os} (${arch}) already exists`)
    return
  }
  console.log(`Building primitive executable for ${os} (${arch})`)
  execSync(
    `env GOOS=${os} GOARCH=${arch} go build -o ${path} github.com/hashbite/primitive`
  )
  console.log('done')
})

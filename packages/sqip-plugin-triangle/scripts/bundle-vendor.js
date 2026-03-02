const { execSync } = require('child_process')
const { existsSync } = require('fs')
const { resolve } = require('path')

const builds = [
  {
    os: 'darwin',
    arch: 'amd64',
    filename: 'triangle-darwin-x64'
  },
  {
    os: 'darwin',
    arch: 'arm64',
    filename: 'triangle-darwin-arm64'
  },
  {
    os: 'linux',
    arch: 'amd64',
    filename: 'triangle-linux-x64'
  },
  {
    os: 'windows',
    arch: 'amd64',
    filename: 'triangle-win32-x64.exe'
  }
]

try {
  // Get triangle
  execSync(`go install github.com/esimov/triangle/v2/cmd/triangle@v2.0.0`)
} catch (err) {
  console.log(
    '\n---\n\nUnable to download and build triangle from https://github.com/esimov/triangle.\n\nIs go installed?\n\nSome users might just want to download it from here: https://golang.org/dl/\n\nBrew users: brew install go\n\n---\n\n'
  )
  process.exit(1)
}

// Build executables
builds.forEach((build) => {
  const { os, arch, filename } = build
  const path = resolve(__dirname, '..', 'triangle-binaries', filename)
  if (existsSync(path)) {
    console.log(`Triangle executable for ${os} (${arch}) already exists`)
    return
  }
  console.log(`Building triangle executable for ${os} (${arch})`)
  execSync(
    `env GOOS=${os} GOARCH=${arch} go build -o ${path} github.com/esimov/triangle/v2/cmd/triangle`
  )
  console.log('done')
})

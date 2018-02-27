const { execSync } = require("child_process");

const builds = [
  {
    os: "darwin",
    arch: "amd64",
    filename: "primitive-darwin-x64"
  },
  {
    os: "linux",
    arch: "amd64",
    filename: "primitive-linux-x64"
  },
  {
    os: "windows",
    arch: "amd64",
    filename: "primitive-win32-x64"
  }
];
builds.forEach(build => {
  const { os, arch, filename } = build;
  console.log(`Building primitive executable for ${os} (${arch})`);
  execSync(
    `env GOOS=${os} GOARCH=${arch} go build -o vendor/${filename} github.com/fogleman/primitive`
  );
  console.log("done");
});

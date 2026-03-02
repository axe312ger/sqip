# Migration

## Migrating from v0 to v1

Most important notes:

* **Node.js >= 20 is now required** (v0 supported Node.js >= 8)
* The API is now async — `sqip()` returns a Promise
* The `filename` option has been renamed to `input` (supports files, globs, and Buffers)
* The new plugin-based system requires a different configuration — pass `plugins` array instead of flat options
* The result SVG is now a Buffer available as `result.content` (was `result.final_svg`)
* All other metadata is now available within `result.metadata` (includes `originalWidth`, `originalHeight`, `palette`, `type`, `dataURI`, etc.)
* Default plugins: `primitive` → `blur` → `svgo` → `data-uri`
* Install plugins separately: `npm install sqip sqip-plugin-primitive sqip-plugin-blur sqip-plugin-svgo sqip-plugin-data-uri`


**old API**:
```js
;(async () => {
  const absolutePath = '/foo/bar/baz.jpg'

  const result = await new Promise((resolve, reject) => {
    try {
      const result = sqip({
        filename: absolutePath,
        // other options
      })
      resolve(result)
    } catch (error) {
      reject(error)
    }
  })

  // Content
  console.log(result.final_svg)

  // Metadata
  console.log(result.width)
  console.log(result.height)
  console.log(result.type)
})()
```

**new API**:
```js
;(async () => {
  const absolutePath = '/foo/bar/baz.jpg'

  const result = await sqip({
    input: absolutePath,
    // other options like output or plugin config
  })

  // Content (as buffer!)
  console.log(result.content)

  // Metadata
  console.log(result.metadata)
})()
```

# Migration

## Migrating from v0 to v1

Most important notes:

* The API is now async
* The new plugin based system requires a different configuration
* The result is now as a Buffer available as `result.content`
* All other metadata is now available within `result.metadata`


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

const { readFileSync } = require('fs')
const { resolve } = require('path')
const { tmpdir } = require('os')

const cheerio = require('cheerio')
const nixt = require('nixt')

const inputFile = resolve(__dirname, '..', '..', 'demo', 'beach.jpg')
const cliCmd = `node ${resolve(__dirname, '..', '..', 'dist', 'cli.js')}`

jest.setTimeout(20000)

describe('cli api', () => {
  test('no config exists programm and shows help', cb => {
    nixt()
      .run(`${cliCmd}`)
      .code(1)
      .expect(result => {
        expect(result.stderr).toMatchSnapshot()
      })
      .end(cb)
  })
  test('--help shows help screen to user', cb => {
    nixt()
      .run(`${cliCmd} ---help`)
      .code(0)
      .expect(result => {
        expect(result.stdout).toMatchSnapshot()
      })
      .end(cb)
  })
  test('no output file will print the result to stdout', cb => {
    nixt()
      .run(`${cliCmd} --input ${inputFile}`)
      .code(0)
      // RegEx based on https://stackoverflow.com/a/475217/2315062
      .stdout(
        /<img width="1024" height="640" src="[^"]+beach.jpg" alt="Add descriptive alt text" style="background-size: cover; background-image: url\(data:image\/svg\+xml;base64,(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?\);">/
      )
      .end(cb)
  })

  test('-o save result to file', cb => {
    const outputFile = resolve(
      tmpdir(),
      `sqip-e2e-test-${new Date().getTime()}.svg`
    )
    nixt()
      .run(`${cliCmd} -i ${inputFile} -o ${outputFile}`)
      .code(0)
      .exist(outputFile)
      .expect(result => {
        const content = readFileSync(outputFile)

        const $ = cheerio.load(content, { xml: true })
        // File content is actually a parseable svg
        expect($('svg')).toHaveLength(1)

        // Check default blur value
        const $filter = $('svg > filter > feGaussianBlur')
        expect($filter).toHaveLength(1)
        expect($filter.attr('stdDeviation')).toBe('12')

        // Check default number of primitives
        const $primitives = $('svg g > g > *')
        expect($primitives).toHaveLength(8)
      })
      .unlink(outputFile)
      .end(cb)
  })
  test('-n sets the number of primitives', cb => {
    const outputFile = resolve(
      tmpdir(),
      `sqip-e2e-test-${new Date().getTime()}.svg`
    )
    nixt()
      .run(`${cliCmd} -i ${inputFile} -o ${outputFile} -n 15 -b 0`)
      .code(0)
      .exist(outputFile)
      .expect(result => {
        const content = readFileSync(outputFile)

        const $ = cheerio.load(content, { xml: true })

        // Check number of primitives
        const $primitives = $('svg g > *')
        expect($primitives).toHaveLength(15)
      })
      .unlink(outputFile)
      .end(cb)
  })
  test('-m sets the primitive mode', cb => {
    const outputFile = resolve(
      tmpdir(),
      `sqip-e2e-test-${new Date().getTime()}.svg`
    )
    nixt()
      .run(`${cliCmd} -i ${inputFile} -o ${outputFile} -m 4`)
      .code(0)
      .exist(outputFile)
      .expect(result => {
        const content = readFileSync(outputFile)

        const $ = cheerio.load(content, { xml: true })

        // Check type of primitives to be all ellipses
        const $primitives = $('svg g > g > *')
        const types = $primitives
          .map((i, $primitive) => $primitive.tagName)
          .get()
        expect(new Set(types)).toEqual(new Set(['ellipse']))
      })
      .unlink(outputFile)
      .end(cb)
  })
  test('-b sets the blur value', cb => {
    const outputFile = resolve(
      tmpdir(),
      `sqip-e2e-test-${new Date().getTime()}.svg`
    )
    nixt()
      .run(`${cliCmd} -i ${inputFile} -o ${outputFile} -b 5`)
      .code(0)
      .exist(outputFile)
      .expect(result => {
        const content = readFileSync(outputFile)

        const $ = cheerio.load(content, { xml: true })

        // Check blur to be given value (5)
        const $filter = $('svg > filter > feGaussianBlur')
        expect($filter).toHaveLength(1)
        expect($filter.attr('stdDeviation')).toBe('5')
      })
      .unlink(outputFile)
      .end(cb)
  })
  test('-b 0 removes the blur', cb => {
    const outputFile = resolve(
      tmpdir(),
      `sqip-e2e-test-${new Date().getTime()}.svg`
    )
    nixt()
      .run(`${cliCmd} -i ${inputFile} -o ${outputFile} -b 0`)
      .code(0)
      .exist(outputFile)
      .expect(result => {
        const content = readFileSync(outputFile)

        const $ = cheerio.load(content, { xml: true })

        // Check blur of 0 does remove the blur
        const $filter = $('svg filter')
        expect($filter).toHaveLength(0)
      })
      .unlink(outputFile)
      .end(cb)
  })
})

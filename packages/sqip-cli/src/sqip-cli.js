import yargs from 'yargs'

import sqip from 'sqip'

const { argv } = yargs
  .usage('\nUsage: sqip --input [path]')
  .option('input', {
    alias: 'i',
    type: 'string',
    normalize: true,
    required: true
  })
  .option('output', {
    alias: 'o',
    type: 'string',
    normalize: true,
    description:
      'Save the resulting SVG to a file. The svg result will be returned by default.'
  })
  .option('numberOfPrimitives', {
    alias: 'n',
    type: 'number',
    description: 'The number of primitive shapes to use to build the SQIP SVG',
    example: "'sqip --numberOfPrimitives=4' or 'sqip -n 4'",
    default: 8
  })
  .option('mode', {
    alias: 'm',
    type: 'number',
    description:
      'The style of primitives to use: \n0=combo, 1=triangle, 2=rect, 3=ellipse, 4=circle, 5=rotatedrect, 6=beziers, 7=rotatedellipse, 8=polygon',
    default: 0
  })
  .option('blur', {
    alias: 'b',
    type: 'number',
    description: 'Set the GaussianBlur SVG filter value. Disable it via 0.',
    default: 12
  })
  .example('sqip --input /path/to/input.jpg', 'Output input.jpg image as SQIP')
  .example(
    'sqip -i input.jpg -n 25 -b 0 -o result.svg',
    'Save input.jpg as result.svg with 25 shapes and no blur'
  )
  .epilog(
    '"SQIP" (pronounced \\skwɪb\\ like the non-magical folk of magical descent) is a SVG-based LQIP technique - https://github.com/technopagan/sqip'
  )
  .wrap(Math.max(80, yargs.terminalWidth()))

const { input, output, numberOfPrimitives, mode, blur } = argv

const options = {
  input,
  output,
  numberOfPrimitives,
  mode,
  blur
}

// Remove undefined arguments coming from yargs to enable proper default options for lib & cli.
Object.keys(options).forEach(key => {
  if (options[key] === undefined) {
    delete options[key]
  }
})

sqip(options).catch(err => {
  console.log(err)
  process.exit(1)
})

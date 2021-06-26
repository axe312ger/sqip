import path from 'path'

import commandLineArgs from 'command-line-args'
import commandLineUsage from 'command-line-usage'
import Debug from 'debug'
import fs from 'fs-extra'
import pkgUp from 'pkg-up'

import sqip, { resolvePlugins, SqipCliOptionDefinition } from 'sqip'

const debug = Debug('sqip-cli')

const defaultOptionList: SqipCliOptionDefinition[] = [
  {
    name: 'help',
    alias: 'h',
    description: 'Show help'
  },
  {
    name: 'version',
    description: 'Show version number'
  },
  {
    name: 'plugins',
    alias: 'p',
    type: String,
    multiple: true,
    description: 'One or more plugins. E.g. "-p primitive blur"'
  },
  {
    name: 'input',
    alias: 'i',
    type: String,
    required: true
  },
  {
    name: 'output',
    alias: 'o',
    type: String,
    description:
      'Define the path of the resulting file. By default SQIP will guess the output file name.'
  },
  {
    name: 'width',
    alias: 'w',
    type: Number,
    defaultValue: 300,
    description:
      'Width of the resulting file. Negative values and 0 will fall back to original image width.'
  },
  {
    name: 'silent',
    type: Boolean,
    defaultValue: false,
    description: 'Supress all output'
  },
  {
    name: 'parseable-output',
    type: Boolean,
    defaultValue: false,
    description:
      'Ensure the output is parseable. Will suppress the preview images and the table borders.'
  }
]

function showHelp({ optionList }: { optionList: SqipCliOptionDefinition[] }) {
  const sections = [
    {
      header: 'sqip CLI',
      content:
        'Usage: sqip --input [path]\n\n"SQIP" (pronounced \\skwɪb\\ like the non-magical folk of magical descent) is a SVG-based LQIP technique - https://github.com/technopagan/sqip'
    },
    {
      header: 'Options',
      optionList
    },
    {
      header: 'Examples',
      content: `Output input.jpg image as SQIP
$ sqip --input /path/to/input.jpg

Save input.jpg as result.svg with 25 shapes and no blur
$ sqip -i input.jpg -n 25 -b 0 -o result.svg`
    }
  ]
  const usage = commandLineUsage(sections)
  console.log(usage)
}

export default async function sqipCLI(): Promise<undefined> {
  const pluginDetectionArgs = commandLineArgs(defaultOptionList, {
    partial: true
  })

  if ('version' in pluginDetectionArgs) {
    const closestPackageJSON = await pkgUp()
    if (!closestPackageJSON) {
      throw new Error('Unable to detect CLI version')
    }
    const { version } = await fs.readJSON(closestPackageJSON)
    console.log(version)
    return process.exit(0)
  }

  let { plugins } = pluginDetectionArgs

  // Default cli plugins
  if (!plugins) {
    plugins = ['primitive', 'blur', 'svgo'].filter(Boolean)
  }

  debug(`Found plugins:\n`, plugins)
  let resolvedPlugins

  try {
    resolvedPlugins = await resolvePlugins(plugins)
  } catch (err) {
    console.error(err)
    process.exit(1)
  }

  // Add new cli options based on enabled plugins
  const pluginOptions = resolvedPlugins.reduce<SqipCliOptionDefinition[]>(
    (definitions, plugin) => {
      const {
        name,
        Plugin: { cliOptions }
      } = plugin
      if (cliOptions) {
        return [
          ...definitions,
          ...cliOptions.map((option) => ({
            ...option,
            name: `${name}-${option.name}`
          }))
        ]
      }
      return definitions
    },
    []
  )

  const optionList = [...defaultOptionList, ...pluginOptions]

  debug(`Generated CLI options:\n`, optionList)

  const args = commandLineArgs(optionList, { partial: true })

  debug(`Parsed CLI args:\n`, args)

  if ('help' in args) {
    showHelp({ optionList })
    return process.exit(0)
  }

  const missing = optionList
    .filter(({ required }) => required)
    .filter(({ name }) => !args[name])
    .map(({ name }) => name)

  if (missing.length) {
    showHelp({ optionList })
    console.error(
      `\nPlease provide the following arguments: ${missing.join(', ')}`
    )
    return process.exit(1)
  }

  const { input, output, width } = args
  const { name } = path.parse(input)
  const guessedOutput = path.resolve(process.cwd(), `${name}.svg`)

  // Build list of plugins with options based on passed arguments
  const pluginsOptions = resolvedPlugins.map(({ name }) => {
    const options = Object.keys(args)
      .filter((args) => args.indexOf(`${name}-`) === 0)
      .reduce((optionMap, argName) => {
        const optionName = argName.substr(`${name}-`.length)
        return { ...optionMap, [optionName]: args[argName] }
      }, {})
    return { name, options }
  })

  const options = {
    input,
    output: output || guessedOutput,
    width,
    plugins: pluginsOptions,
    silent: args.silent,
    parseableOutput: args['parseable-output']
  }

  debug(`Final sqip options:`, options)

  try {
    await sqip(options)
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}

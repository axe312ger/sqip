# Contributing to SQIP

[![CircleCI](https://circleci.com/gh/axe312ger/sqip.svg?style=svg)](https://circleci.com/gh/axe312ger/sqip) [![codecov](https://codecov.io/gh/axe312ger/sqip/branch/master/graph/badge.svg)](https://codecov.io/gh/axe312ger/sqip) [![Maintainability](https://api.codeclimate.com/v1/badges/fc81fa5e535561c0a6ff/maintainability)](https://codeclimate.com/github/axe312ger/sqip/maintainability)

[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-v1.4%20adopted-ff69b4.svg)](CODE_OF_CONDUCT.md)


> :+1::tada: First off, thanks for taking the time to contribute! :tada::+1:

*Atom Dev Team* - [CONTRIBUTING.md](https://github.com/atom/atom/blob/master/CONTRIBUTING.md)

## Development Setup

[![lerna](https://img.shields.io/badge/lerna-monorepo-4B32C3.svg?logo=lerna&style=flat)](https://lerna.js.org/) [![yarn](https://img.shields.io/badge/yarn-package%20management-C21325.svg?logo=yarn&style=flat)](https://yarnpkg.com)

SQIP uses a `monorepo` pattern to manage its many dependencies and relies on Lerna and [Yarn](https://yarnpkg.com/) to configure the repository for active development.

### Requirements

* Make sure to have [Yarn installed](https://yarnpkg.com/en/docs/install)

### Installation and repo setup

Yarn will automatically setup the monorepo for you. The only thing you have to do:

```sh
yarn
```

You can find all available lerna commands via

```sh
npx lerna --help
```

### Directory structure

SQIP is organized in packages. They are located in the `packages` directory. Each package is released as a separate NPM package.

All packages should follow the same directory structure to allow proper TS builds.

#### Relevant files and directories:

```
.
├── Dockerfile
├── lerna.json
├── package.json
├── packages
│   ├── sqip
│   │   ├── README.md
│   │   ├── __tests__
│   │   ├── dist
│   │   ├── node_modules
│   │   ├── package.json
│   │   └── src
│   ├── ...
└── yarn.lock
```

## Developing

If not specified differently, all commands are executed from the project root directory.

A `npm run` will give you a first overview of all available scripts.

### Building the source

To build/transpile the source of all packages via babel, execute:

```sh
npm run build
```

You can watch for changes as well:

```sh
npm run build:watch
```

### Create a new plugin

To build a new SQIP plugin is pretty simple:

1. Make sure the SQIP repository is checked out at master with the latest status and you ran `yarn`.
1. Create a rough file structure via `lerna create --es-module sqip-plugin-my-amazing-plugin`
2. Use the following template to rocket-start your new plugin:

```js
import { SqipPlugin } from 'sqip'

export default class MyAmazingPlugin extends SqipPlugin {
  static get cliOptions() {
    // Make options available to the CLI.
    return [
      {
        name: 'bar',
        alias: 'b',
        type: String,
        description: 'Set replacement value for "foo"',
        defaultValue: 'bar'
      }
    ]
  }

  constructor({ pluginOptions }) {
    /**
     * Will enhance your plugin instance with the following:
     * this.metadata: Object with width, height and type
     * this.sqipConfig: The configuration passed to SQIP by the user
    */
    super(...arguments)


    // Set your options
    this.options = {
      // Inject default options
      bar: 'bar',
      ...pluginOptions
    }
  }

  async apply(imageBuffer) {
    console.log('Incoming image:', imageBuffer)

    // Check for correct format for your plugin
    if (this.metadata.type !== 'svg') {
      throw new Error(
        'The plugin needs a svg image as input.'
      )
    }

    // Read plugin options
    const { bar } = this.options

    // Do some transformation
    const svg = imageBuffer.toString()
    const newSvg = svg.replace('foo', bar)

    // Hint: Consider to use https://www.npmjs.com/package/buffer-replace for replacements instead of this hack

    // Return new svg as buffer
    return Buffer.from(newSvg)
  }
}
```

### Add dependencies to package

To add a dependency to a package, you need to go into the package directory and execute Yarn as usual:

```sh
yarn add the-dependency-i-badly-need
```

You might speed this up by using:

```sh
npx lerna add the-dependency-i-badly-need
```

Make sure to read `npx lerna add --help`

## Testing

[![eslint](https://img.shields.io/badge/eslint-linting-4B32C3.svg?logo=eslint&style=flat)](https://eslint.org/) [![jest](https://img.shields.io/badge/jest-testing-C21325.svg?logo=jest&style=flat)](https://github.com/facebook/jest)

This project uses [eslint](https://eslint.org/) for linting and [jest](https://github.com/facebook/jest) for unit and e2e tests.

* Run `npm run lint` to lint all packages
* Run `npm run test` to lint and test all packages

### Watching and executing specific tests

Run a specific test file and watch for changes:

```sh
npx jest packages/sqip/__tests__/unit/sqip.test.js --watch
```

### Unit tests

* Run `npm run test:unit` to execute unit tests in all packages
* Run `npm run test:unit:watch` to execute unit tests in all packages and rerun if code changes

### End to end tests

* Run `npm run test:e2e` to execute end to end tests in all packages. Will build the packages before execution.
* Run `npm run test:e2e:watch` to execute end to end tests in all packages and rerun if code changes

**Hint:** When watching end to end tests, you need to rebuild the source after each of your changes. You can use `npm run build:watch` for this.

## Code style

[![Code Style](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat)](https://prettier.io/)

This project uses [prettier](https://prettier.io/) to format its source code. Your committed code will be automatically linted and transformed via [husky](https://www.npmjs.com/package/husky).

See [.prettierrc](.prettierrc) for the configuration details.

## Commit conventions

[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/) [![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

To keep the automated release and changelog engine running, every commit should follow the [conventional commits guidelines](https://www.conventionalcommits.org/) originally introduced by angular.

You may use [Commitizen](https://commitizen.github.io/cz-cli/) to ease up creating commit messages with the conventional commits guidelines. It is fully integrated into the project.

After merging into our master branch, this will allow [semantic release](https://github.com/semantic-release/semantic-release) to decide what kind of version to release. An automated changelog will also be created.

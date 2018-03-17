const SVGO = require('svgo')

const { runSVGO, replaceSVGAttrs } = require('../../../src/utils/svg')

jest.mock('svgo')

test('runSVGO', () => {
  const inputSVG = '<svg />'
  runSVGO(inputSVG)
  expect(SVGO).toHaveBeenCalledTimes(1)
  expect(SVGO).toHaveBeenLastCalledWith({ multipass: true, floatPrecision: 1 })
  expect(SVGO.mock.instances[0].optimize).toHaveBeenCalledTimes(1)
  expect(SVGO.mock.instances[0].optimize.mock.calls[0][0]).toBe(inputSVG)
  // @todo switch to async svgo, this will allow proper testing
})

describe('replaceSVGAttrs', () => {
  test('svg with group, no config', () => {
    const result = replaceSVGAttrs(
      '<svg><path fill="#bada55" d="M0 0h1024v640H0z"/><g><path fill="#C0FFEE" d="M51.5 17.5l4 18 15 1z"/></g></svg>',
      {}
    )
    expect(result).toMatchSnapshot()
  })
  test('svg with group, config with dimensions only', () => {
    const result = replaceSVGAttrs(
      '<svg><path fill="#bada55" d="M0 0h1024v640H0z"/><g><path fill="#C0FFEE" d="M51.5 17.5l4 18 15 1z"/></g></svg>',
      { width: 1024, height: 640 }
    )
    expect(result).toMatchSnapshot()
  })
  test('svg with group, config with dimensions only and blur', () => {
    const result = replaceSVGAttrs(
      '<svg><path fill="#bada55" d="M0 0h1024v640H0z"/><g><path fill="#C0FFEE" d="M51.5 17.5l4 18 15 1z"/></g></svg>',
      { width: 1024, height: 640, blur: 5 }
    )
    expect(result).toMatchSnapshot()
  })
  test('svg with group, config with dimensions and zero blur', () => {
    const result = replaceSVGAttrs(
      '<svg><path fill="#bada55" d="M0 0h1024v640H0z"/><g><path fill="#C0FFEE" d="M51.5 17.5l4 18 15 1z"/></g></svg>',
      { width: 1024, height: 640, blur: 0 }
    )
    expect(result).toMatchSnapshot()
  })
  test('svg without group, config with dimensions only', () => {
    const result = replaceSVGAttrs(
      '<svg><path fill="#bada55" d="M0 0h1024v640H0z"/><path fill="#C0FFEE" d="M51.5 17.5l4 18 15 1z"/></svg>',
      { width: 1024, height: 640 }
    )
    expect(result).toMatchSnapshot()
  })
})

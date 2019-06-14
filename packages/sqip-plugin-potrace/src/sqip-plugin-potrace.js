import { promisify } from 'util'

import { SqipPlugin } from 'sqip'
import potrace from 'potrace'

const trace = promisify(potrace.trace)
const posterize = promisify(potrace.posterize)

export default class sqipPluginPotrace extends SqipPlugin {
  static get cliOptions() {
    // Make options available to the CLI.
    return [
      {
        name: 'posterize',
        type: Boolean,
        description: 'Use posterize instead of trace',
        defaultValue: false
      }
    ]
  }

  constructor({ pluginOptions }) {
    super(...arguments)
    this.options = {
      ...pluginOptions
    }
  }

  async apply() {
    if (this.options.posterize) {
      const result = await posterize(this.filePath, {
        background: this.metadata.palette.DarkMuted.getHex(),
        color: this.metadata.palette.LightVibrant.getHex(),
        // steps: 3,
        // threshold: 200,
        // fillStrategy: potrace.Posterize.FILL_MEAN,
        optTolerance: 0.4,
        turdSize: 100,
        turnPolicy: potrace.Potrace.TURNPOLICY_MAJORITY
      })

      return result
    }

    const result = await trace(this.filePath, {
      background: 'transparent', //this.metadata.palette.Muted.getHex(),
      color: this.metadata.palette.Vibrant.getHex(),
      //   threshold: 120
      optTolerance: 0.4,
      turdSize: 100,
      turnPolicy: potrace.Potrace.TURNPOLICY_MAJORITY
    })

    return result
  }
}

declare module 'potrace' {
  export interface PotraceDefaultOptions {
    turnPolicy: string
    turdSize: number
    alphaMax: number
    optCurve: boolean
    optTolerance: number
    threshold: number
    blackOnWhite: boolean
    color: string
    background: string
  }
  export interface PotracePosterizeOptions extends PotraceDefaultOptions {
    steps: number
  }

  export function trace(
    image: Buffer,
    options: PotraceDefaultOptions,
    cb: (err: Error, val: string) => void
  ): string

  export function posterize(
    image: Buffer,
    options: PotracePosterizeOptions,
    cb: (err: Error, val: string) => void
  ): string

  enum PotraceConstants {
    COLOR_AUTO = 'auto',
    COLOR_TRANSPARENT = 'transparent',
    THRESHOLD_AUTO = -1,
    TURNPOLICY_BLACK = 'black',
    TURNPOLICY_WHITE = 'white',
    TURNPOLICY_LEFT = 'left',
    TURNPOLICY_RIGHT = 'right',
    TURNPOLICY_MINORITY = 'minority',
    TURNPOLICY_MAJORITY = 'majority'
  }

  export const Potrace: any
}

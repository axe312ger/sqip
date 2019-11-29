# `sqip-plugin-potrace`

> TODO: description

## Options

##### Options
| Argument  | Type | Description |
| ------------- | ------------- | ------------- |
| --potrace-color | string          | Fill color. SQIP will pick a fitting color by default. |
| --potrace-background | string     | Background color. SQIP will pick a fitting color by default. |
| --potrace-posterize |  boolean    | Use posterize instead of trace |
| --potrace-steps | number[]        | Posterize only: Number of steps or array of thresholds |
| --potrace-turnPolicy | string     | how to resolve ambiguities in path decomposition. Possible values are exported as constants: TURNPOLICY_BLACK, TURNPOLICY_WHITE, TURNPOLICY_LEFT, TURNPOLICY_RIGHT, TURNPOLICY_MINORITY, TURNPOLICY_MAJORITY. |
| --potrace-turdSize | number       | suppress speckles of up to this size |
| --potrace-alphaMax | number       | corner threshold parameter |
| --potrace-optCurve | boolean      | curve optimization |
| --potrace-optTolerance | number   | curve optimization tolerance |
| --potrace-threshold | number      | threshold below which color is considered black. Should be a number in range 0..255. By default THRESHOLD_AUTO is used in which case threshold will be selected automatically using Algorithm For Multilevel Thresholding |
| --potrace-blackOnWhite | boolean  | specifies colors by which side from threshold should be turned into vector shape |

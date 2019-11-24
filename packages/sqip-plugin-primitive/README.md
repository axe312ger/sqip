# `sqip-plugin-primitive`

> TODO: description

##### Options
| command  | Description |
| ------------- | ------------- |
| -n, --primitive-numberOfPrimitives  *number* | The number of primitive shapes to use to build the SQIP SVG
| -m, --primitive-mode *number* | The style of primitives to use: <br/> 0=combo, <br/>  1=triangle, <br/> 2=rect, <br/>  3=ellipse, <br/> 4=circle, <br/> 5=rotatedrect, <br/> 6=beziers, <br/> 7=rotatedellipse, <br/> 8=polygon |
| --primitive-rep number | add N extra shapes each iteration with reduced search (mostly good for beziers) |
| --primitive-alpha number | color alpha (use 0 to let the algorithm choose alpha for each shape) |
| --primitive-background string | starting background color (hex) |
| --primitive-cores number | number of parallel workers (default uses all cores) |

## Usage

```
import sqipPluginPrimitive from 'sqip-plugin-primitive';

// TODO: DEMONSTRATE API
```

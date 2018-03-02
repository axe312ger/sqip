//#############################################################################
//#
//# "SQIP" (pronounced \skwɪb\ like the non-magical folk of magical descent)
//# is a SVG-based LQIP technique - https://github.com/technopagan/sqip
//#
//# Installation:
//# npm install -g sqip
//#
//# Requirements:
//# * Node.js >= v.6 (https://nodejs.org/en/)
//# * Golang (https://golang.org/doc/install)
//# * Primitive (https://github.com/fogleman/primitive)
//#
//#############################################################################


//#############################################################################
//# CONFIG
//#############################################################################

// Require the necessary modules to make sqip work
const sizeOf = require('image-size');
const argv = require('argv');
const os = require('os');
const child_process = require('child_process');
const fs = require('fs');
const path = require('path');
const svgo = require('svgo');

// Define a a temp file, ideally on a RAMdisk that Primitive can write to
const primitive_output_file = os.tmpdir() + '/primitive_tempfile.svg';

const VENDOR_DIR = path.resolve(__dirname, '..', 'vendor')
let primitiveExecutable = 'primitive'

// Use 'argv' to set up all available commandline parameters that shall be available when running sqip
const argvOptions = [{
        name: 'numberOfPrimitives',
        short: 'n',
        type: 'int',
        description: 'The number of primitive shapes to use to build the SQIP SVG',
        example: "'sqip --numberOfPrimitives=4' or 'sqip -n 4'"
    },
    {
        name: 'output',
        short: 'o',
        type: 'path',
        description: 'Save the resulting SVG to a file',
        example: "'sqip --output=/foo/bar/image.svg' or 'sqip -o /foo/bar/image.svg'"
    },
    {
        name: 'mode',
        short: 'm',
        type: 'int',
        description: `The style of primitives to use. Defaults to 0.
                0=combo, 1=triangle, 2=rect, 3=ellipse, 4=circle, 5=rotatedrect,
                6=beziers, 7=rotatedellipse, 8=polygon`,
        example: "'sqip --mode=3' or 'sqip -m 3'"
    },
    {
        name: 'blur',
        short: 'b',
        type: 'int',
        description: `GaussianBlur SVG filter value. Disable via 0, defaults to 12`,
        example: "'sqip --blur=3' or 'sqip -b 3'"
    }
];
const getArguments = () => argv.option(argvOptions).run();


//#############################################################################
//# SANITY CHECKS
//#############################################################################

// Sanity check: use the exit state of 'type' to check for Primitive availability
const checkForPrimitive = (shouldThrow = false) => {
    const primitivePath = path.join(VENDOR_DIR, `primitive-${os.platform()}-${os.arch()}`)

    if (fs.existsSync(primitivePath)) {
        primitiveExecutable = primitivePath
        return
    }

    const errorMessage = "Please ensure that Primitive (https://github.com/fogleman/primitive, written in Golang) is installed and globally available";
    try {
        if (process.platform === 'win32') {
            child_process.execSync('where primitive');
        } else {
            child_process.execSync('type primitive')
        }
    } catch (e) {
        if (shouldThrow) {
            throw new Error(errorMessage);
        }
        console.log(errorMessage);
        process.exit(1);
    }
};

// Sanity check: make sure that the user has provided a file for sqip to work on
const getInputfilePath = (targets, shouldThrow = false) => {
    const errorMessage = `Please provide an input image, e.g. ${shouldThrow ? 'sqip({ filename: "input.jpg" })' : 'sqip input.jpg'}`;
    if (!targets || !targets[0]) {
        if (shouldThrow) {
            throw new Error(errorMessage);
        } else {
            console.log(errorMessage);
            process.exit(1);
        }
    }
    return path.resolve(process.cwd(), targets[0]);
}

// Sanity check: make sure that the value was passed to the `output` option
// Fixes https://github.com/technopagan/sqip/issues/11
const getOutputFilePath = () => {
  const index = process.argv.findIndex(arg => arg === '-o' || arg === '--output');
  return index > 0 ? process.argv[index + 1] : null;
}

//#############################################################################
//# FUNCTIONS TOOLBELT
//#############################################################################

// Use image-size to retrieve the width and height dimensions of the input image
// We need these sizes to pass to Primitive and to write the SVG viewbox
const getDimensions = (filename) => sizeOf(filename);

// Since Primitive is only interested in the larger dimension of the input image, let's find it
const findLargerImageDimension = ({ width, height }) => width > height ? width : height;

// Run Primitive with reasonable defaults (rectangles as shapes, 9 shaper per default) to generate the placeholder SVG
const runPrimitive = (filename, { numberOfPrimitives = 8, mode = 0 }, primitive_output, dimensions) => {
    child_process.execSync(`${primitiveExecutable} -i "${filename}" -o ${primitive_output} -n ${numberOfPrimitives} -m ${mode} -s ${findLargerImageDimension(dimensions)}`);
}

// Read the Primitive-generated SVG so that we can continue working on it
const readPrimitiveTempFile = (primitive_output_file) => fs.readFileSync(primitive_output_file, { encoding: 'utf-8' });

// USe SVGO with settings for maximum compression to optimize the Primitive-generated SVG
const runSVGO = (primitive_svg) => {
    const svgo_instance = new svgo({ multipass: true, floatPrecision: 1 });
    let retVal = '';
    svgo_instance.optimize(primitive_svg, ({ data }) => retVal = data);
    return retVal;
}

// (Naively) Add Group to SVG
// For schema, see: https://github.com/fogleman/primitive/blob/master/primitive/model.go#L86
const patchSVGGroup = (svg) => {
  const gStartIndex = svg.match(/<path.*?>/).index + svg.match(/<path.*?>/)[0].length;
  const gEndIndex = svg.match(/<\/svg>/).index;
  const svgG = `<g filter='url(#c)' fill-opacity='.5'>`;
  return `${svg.slice(0, gStartIndex)}${svgG}${svg.slice(gStartIndex, gEndIndex)}</g></svg>`;
}

// Add viewbox and preserveAspectRatio attributes as well as a Gaussian Blur filter to the SVG
// When missing, add group (element with blur applied) using patchSVGGroup()
// We initially worked with a proper DOM parser to manipulate the SVG's XML, but it was very opinionated about SVG syntax and kept introducing unwanted tags. So we had to resort to RegEx replacements
const replaceSVGAttrs = (svg, { width, height, blur }) => {
  let filter = '';
  let blurStdDev = blur || 12;
  let blurFilterId = 'b';
  let newSVG = svg;

  if (blur !== 0) {
    if (svg.match(/<svg.*?><path.*?><g/) === null) {
        blurStdDev = 55;
        newSVG = patchSVGGroup(newSVG);
        blurFilterId = 'c';
    } else {
        newSVG = newSVG.replace(/(<g)/, `<g filter="url(#${blurFilterId})"`);
    }
    filter = `<filter id="${blurFilterId}"><feGaussianBlur stdDeviation="${blurStdDev}" /></filter>`
  }
  return newSVG.replace(/(<svg)(.*?)(>)/,`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">${filter}`);
}

// If the user chooses to save the SVG to a file using the --output parameter, write the file
const writeSVGOutput = (filename, content) => {
    fs.writeFileSync(filename, content);
}

// In case the user the did not provide the --output switch and is thus opting for the default stdout output inside an <img>, prepare the base64 encoded version of the SVG
const encodeBase64 = (primitive_svgo) => new Buffer(primitive_svgo).toString('base64');

// Place the base64 encoded version as a background image inside an <img> tag, set width + height etc. and print it out as the final result
const printFinalResult = ({ width, height }, filename, svg_base64encoded) => {
    const final_result = `<img width="${width}" height="${height}" src="${filename}" alt="Add descriptive alt text" style="background-size: cover; background-image: url(data:image/svg+xml;base64,${svg_base64encoded});">`
    console.log(final_result);
}


//#############################################################################
//# MAIN FUNCTION CALL
//#############################################################################

const main = (filename, options) => {
    const img_dimensions = getDimensions(filename)
    const svgOptions = Object.assign({
        blur: options.blur
    }, img_dimensions);

    // Do not pass blur to primitive
    delete options.blur

    runPrimitive(filename, options, primitive_output_file, img_dimensions);
    const primitive_output = readPrimitiveTempFile(primitive_output_file);
    const svgo_output = runSVGO(primitive_output);
    const final_svg = replaceSVGAttrs(svgo_output, svgOptions);
    const svg_base64encoded = encodeBase64(final_svg);

    return { final_svg, svg_base64encoded, img_dimensions };
};


/*
 * CLI API
 */
module.exports.run = () => {
    checkForPrimitive();
    const { targets, options } = getArguments();
    const filename = getInputfilePath(targets);
    const { final_svg, svg_base64encoded, img_dimensions } = main(filename, options);
    const output = getOutputFilePath();

    output ?
        writeSVGOutput(output, final_svg) :
        printFinalResult(img_dimensions, filename, svg_base64encoded);
};


/**
 * NODE API
 */
module.exports.node = apiOptions => {
    checkForPrimitive(true);
    const filename = getInputfilePath([apiOptions.filename], true);

    return main(filename, apiOptions);
}

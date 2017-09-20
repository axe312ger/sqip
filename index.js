#! /usr/bin/env node

//#############################################################################
//#
//# Introduction:
//# Low quality image placeholders (LQIP, https://www.guypo.com/introducing-lqip-low-quality-image-placeholders/)
//# are a good way to improve the user experience during webpage loading. Companies
//# like Facebook (https://code.facebook.com/posts/991252547593574/the-technology-behind-preview-photos)
//# and Medium (https://jmperezperez.com/medium-image-progressive-loading-placeholder/)
//# use this technique to quickly show previews of high-res images.
//# LQIP work by creating a small, low-quality thumbnail raster image and base64-encoding
//# it so that it can be inlined. The resulting payload is >=~600 characters in size.
//# And since the LQIP image is still a raster image, it may not create a decent
//# initial impression on HiDPI screens, especially during viewport changes. 
//# SQIP addresses these issues by building the low quality image placeholder
//# as an SVG, using primitive forms approximating the main features visible
//# in the hires input image. The amount of primitive SVG forms can be modified
//# to further increase the amount of detail visible in the SVG or decrease the
//# overall bytesize of the preview.
//#
//# Installation:
//# npm install -g file:/path/to/sqip/
//# 
//# Requirements:
//# * Node.js >= v.6 (https://nodejs.org/en/)
//# * Golang (https://golang.org/doc/install)
//# * Primitive (https://github.com/fogleman/primitive)
//#
//# CLI usage:
//# sqip input.jpg // generates a SVG placeholder and prints an example <img> tag to stdout
//# sqip -o output.svg input.jpg // Save the placeholder SVG to a file instead of printing the <img> to stdout
//# sqip -n 4 input.jpg // reduce the number of primitive SVG shapes (default=8) to further reduce placeholder bytesize
//#
//# ToDo:
//# * Implement a check for <g></g> so that our RegEx to place the filter can work - currently <g></g> is not always present
//# * Implement the copy-to-clipboard functionality from lqip-cli to copy output to clipboard
//#
//#############################################################################


//#############################################################################
//# CONFIG
//#############################################################################

// Require the necessary modules to make sqip work
const sizeOf = require('image-size');
const argv = require('argv');
const os = require('os')
const child_process = require('child_process');
const fs = require('fs');
const path = require('path');
const svgo = require('svgo');

// Define a a temp file, ideally on a RAMdisk that Primitive can write to
const primitive_output_file = os.tmpdir() + '/primitive_tempfile.svg';

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
    }
];
const getArguments = () => argv.option(argvOptions).run();


//#############################################################################
//# SANITY CHECKS
//#############################################################################

// Sanity check: use the exit state of 'type' to check for Primitive availability
const checkForPrimitive = () => {
    try {
        child_process.execSync('type primitive')
    } catch (e) {
        console.log("Please ensure that Primitive (https://github.com/fogleman/primitive, written in Golang) is installed and globally available");
        process.exit(1);
    };
}

// Sanity check: make sure that the user has provided a file for sqip to work on
const getInputfilePath = (targets) => {
    if (!targets[0]) {
        console.log("Please provide an input image, e.g. 'sqip input.jpg'");
        process.exit(1);
    }
    return path.resolve(process.env.PWD, targets[0]);
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
const runPrimitive = (filename, { numberOfPrimitives = 8 }, primitive_output, dimensions) => {
    child_process.execSync(`primitive -i ${filename} -o ${primitive_output} -n ${numberOfPrimitives} -m 0 -s ${findLargerImageDimension(dimensions)}`);
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

// Add viewbox and preserveAspectRatio attributes as well as a Gaussian Blur filter to the SVG
// We initially worked with a proper DOM parser to manipulate the SVG's XML, but it was very opinionated about SVG syntax and kept introducing unwanted tags. So we had to resort to RegEx replacements
const replaceSVGAttrs = (svg, { width, height }) => svg.replace(/(<svg)(.*?)(>)/, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}"><filter id="b"><feGaussianBlur stdDeviation="12" /></filter>`)
    .replace(/(<g)/, '<g filter="url(#b)"');

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

const main = () => {
    checkForPrimitive();
    const { targets, options } = getArguments();
    const filename = getInputfilePath(targets);
    const img_dimensions = getDimensions(filename);
    runPrimitive(filename, options, primitive_output_file, img_dimensions);
    const primitive_output = readPrimitiveTempFile(primitive_output_file);
    const svgo_output = runSVGO(primitive_output);
    const final_svg = replaceSVGAttrs(svgo_output, img_dimensions);
    const svg_base64encoded = encodeBase64(final_svg);
    options.output ? writeSVGOutput(options.output, final_svg) : printFinalResult(img_dimensions, filename, svg_base64encoded);
}

main();
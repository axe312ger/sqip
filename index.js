#! /usr/bin/env node

const sizeOf = require('image-size');
const argv = require('argv');
const os = require('os')
const child_process = require('child_process');
const fs = require('fs');
const path = require('path');
const svgo = require('svgo');

const primitive_output_file = os.tmpdir()+'/primitive_tempfile.svg';

const argvOptions = [
		{
		    name: 'numberOfPrimitives',
		    short: 'n',
		    type: 'int',
		    description: 'The number of primitive shapes to use to build the SQIP SVG',
		    example: "'sqip --numberOfPrimitives=9' or 'sqip -n 9'"
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

const checkForPrimitive = () => {
	try {
		child_process.execSync('type primitive')
	} catch(e) {
		console.log("Please ensure that Primitive (https://github.com/fogleman/primitive) is installed globally");
		process.exit(1);
	};
}

const getInputfilePath = (targets) => {
	if(!targets[0]){
		console.log("Please provide an input image, e.g. 'sqip input.jpg'");
		process.exit(1);
	}
	return path.resolve(process.env.PWD, targets[0]);
}

const getDimensions = (filename) => sizeOf(filename);

const findLargerImageDimension = ({width, height}) => width > height ? width : height; 

const runPrimitive = (filename, {numberOfPrimitives = 9}, primitive_output, dimensions) => {
	child_process.execSync(`primitive -i ${filename} -o ${primitive_output} -n ${numberOfPrimitives} -m 2 -s ${findLargerImageDimension(dimensions)}`);
}

const readPrimitiveTempFile = (primitive_output_file) => fs.readFileSync(primitive_output_file, {encoding: 'utf-8'});

const runSVGO = (primitive_svg) => {
	const svgo_instance = new svgo({multipass: true, floatPrecision: 1});
	let retVal = '';
	svgo_instance.optimize(primitive_svg, ({data}) => retVal = data);
	return retVal;
}

const replaceSVGAttrs = (svg, {width, height}) => svg.replace(/(<svg)(.*?)(>)/, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMinYMin meet"><filter id="blur"><feGaussianBlur stdDeviation="42" /></filter>`)
		.replace(/(<g)/, '<g filter="url(#blur)"');

const writeSVGOutput = (filename, content) => {
	fs.writeFileSync(filename, content);
}

const encodeBase64 = (primitive_svgo) => new Buffer(primitive_svgo).toString('base64');

const printFinalResult = ({width, height}, filename, svg_base64encoded) => {
	const final_result = `<img width="${width}" height="${height}" src="${filename}" alt="Add descriptive alt text" style="background-size: cover; background-image: url(data:image/svg+xml;base64,${svg_base64encoded});">`
	console.log(final_result);
}


const main = () => {
	checkForPrimitive();
	const{targets, options} = getArguments();
	const filename = getInputfilePath(targets);
	const img_dimensions = getDimensions(filename);
	runPrimitive(filename, options, primitive_output_file, img_dimensions);
	const primitive_output = readPrimitiveTempFile(primitive_output_file);
	const svgo_output = runSVGO(primitive_output);
	const final_svg = replaceSVGAttrs(svgo_output, img_dimensions);
	const svg_base64encoded = encodeBase64(final_svg);
	options.output?writeSVGOutput(options.output, final_svg):printFinalResult(img_dimensions, filename, svg_base64encoded);
}

main();

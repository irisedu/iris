import fs from 'fs-extra';
import path from 'path';
import { unified } from 'unified';
import rehypeParse from 'rehype-parse';
import rehypeStringify from 'rehype-stringify';
import FileProcessor, { type FileProcessorArgs } from '../FileProcessor.js';

import rehypeMinifyAttributeWhitespace from 'rehype-minify-attribute-whitespace';
import rehypeMinifyCssStyle from 'rehype-minify-css-style';
import rehypeMinifyJsonScript from 'rehype-minify-json-script';
import rehypeMinifyStyleAttribute from 'rehype-minify-style-attribute';
import rehypeMinifyWhitespace from 'rehype-minify-whitespace';
import rehypeRemoveComments from 'rehype-minify-whitespace';
import rehypeRemoveDuplicateAttributeValues from 'rehype-remove-duplicate-attribute-values';
import rehypeRemoveEmptyAttribute from 'rehype-remove-empty-attribute';

// rehype-preset-minify does too much and does not bundle well
const rehypeMinifyNoJs = {
	plugins: [
		rehypeMinifyAttributeWhitespace,
		rehypeMinifyCssStyle,
		rehypeMinifyJsonScript,
		rehypeMinifyStyleAttribute,
		rehypeMinifyWhitespace,
		rehypeRemoveComments,
		rehypeRemoveDuplicateAttributeValues,
		rehypeRemoveEmptyAttribute
	],
	settings: {
		// From rehype-preset-minify
		allowParseErrors: true,
		bogusComments: true,
		characterReferences: {
			omitOptionalSemicolons: true,
			useShortestReferences: true
		},
		closeEmptyElements: true,
		collapseEmptyAttributes: true,
		omitOptionalTags: true,
		preferUnquoted: true,
		quoteSmart: true,
		tightAttributes: true,
		tightCommaSeparatedLists: true,
		tightDoctype: true,
		tightSelfClosing: true
	}
};

export default class HtmlFileProcessor extends FileProcessor {
	override async process({ inDir, outDir, filePath }: FileProcessorArgs) {
		const inPath = path.join(inDir, filePath);
		const outPath = path.join(outDir, filePath);

		const contents = await fs.readFile(inPath, 'utf-8');
		const minified = await unified()
			.use(rehypeParse)
			.use(rehypeMinifyNoJs)
			.use(rehypeStringify)
			.process(contents);

		await fs.writeFile(outPath, minified.value);
	}

	override handlesFile(filePath: string) {
		return filePath.endsWith('.html');
	}
}

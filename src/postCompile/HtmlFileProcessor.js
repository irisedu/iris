import fs from 'fs-extra';
import path from 'path';
import minifyHtml from '@minify-html/node';
import FileProcessor from '../FileProcessor.js';

export default class HtmlFileProcessor extends FileProcessor {
	async process({ inDir, outDir, filePath }) {
		const inPath = path.join(inDir, filePath);
		const outPath = path.join(outDir, filePath);

		const contents = await fs.readFile(inPath);
		const minified = minifyHtml.minify(contents, {
			keep_spaces_between_attributes: false,
			minify_css: true
		});

		await fs.writeFile(outPath, minified);
	}

	handlesFile(filePath) {
		return filePath.endsWith('.html');
	}
}

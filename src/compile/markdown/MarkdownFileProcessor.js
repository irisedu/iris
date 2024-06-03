import fs from 'fs-extra';
import path from 'path';
import FileProcessor from '../../FileProcessor.js';
import MarkdownRenderer from './MarkdownRenderer.js';
import { findFileInParents } from '../../utils.js';

const renderer = new MarkdownRenderer();

export default class MarkdownFileProcessor extends FileProcessor {
	async process({ inDir, outDir, filePath }) {
		const inPath = path.join(inDir, filePath);
		const outPath = path.join(
			outDir,
			MarkdownFileProcessor.getOutputPath(filePath)
		);

		const input = await fs.readFile(inPath);
		const bibliography = await findFileInParents(
			path.dirname(inPath),
			'bibliography.bib'
		);

		const vfile = await renderer.render({
			filePath,
			input,
			bibliography,
			config: this.config
		});

		vfile.path = filePath;

		await fs.ensureDir(path.dirname(outPath));

		await fs.writeFile(
			outPath,
			JSON.stringify({
				data: vfile.data,
				contents: vfile.value
			})
		);

		return vfile;
	}

	handlesFile(filePath) {
		return filePath.endsWith('.md');
	}

	static getOutputPath(filePath) {
		return filePath + '.json';
	}
}

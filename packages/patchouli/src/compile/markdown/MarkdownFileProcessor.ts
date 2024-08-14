import fs from 'fs-extra';
import path from 'path';
import FileProcessor, { type FileProcessorArgs } from '../../FileProcessor';
import FileInfo from '../../FileInfo';
import MarkdownRenderer from './MarkdownRenderer';
import { findFileInParents } from '../../utils';

const renderer = new MarkdownRenderer();

export default class MarkdownFileProcessor extends FileProcessor {
	override async process({ inDir, outDir, filePath }: FileProcessorArgs) {
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

		await fs.ensureDir(path.dirname(outPath));

		await fs.writeFile(
			outPath,
			JSON.stringify({
				data: vfile.data,
				contents: vfile.value
			})
		);

		return new FileInfo(filePath);
	}

	override handlesFile(filePath: string) {
		return filePath.endsWith('.md');
	}

	static override getOutputPath(filePath: string) {
		return filePath + '.json';
	}
}

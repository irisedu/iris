import fs from 'fs-extra';
import path from 'path';
import { optimize as svgoOptimize } from 'svgo';
import FileProcessor, { type FileProcessorArgs } from '../FileProcessor.js';

export default class SvgFileProcessor extends FileProcessor {
	override async process({ inDir, outDir, filePath }: FileProcessorArgs) {
		const inPath = path.join(inDir, filePath);
		const outPath = path.join(outDir, filePath);

		const contents = await fs.readFile(inPath, 'utf-8');
		const optimizeResult = svgoOptimize(contents, {
			path: inPath,
			multipass: true
		});

		await fs.writeFile(outPath, optimizeResult.data);
	}

	override handlesFile(filePath: string) {
		return filePath.endsWith('.svg');
	}
}

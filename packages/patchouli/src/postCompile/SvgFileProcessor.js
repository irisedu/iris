import fs from 'fs-extra';
import path from 'path';
import { optimize as svgoOptimize } from 'svgo';
import FileProcessor from '../FileProcessor.js';

export default class SvgFileProcessor extends FileProcessor {
	async process({ inDir, outDir, filePath }) {
		const inPath = path.join(inDir, filePath);
		const outPath = path.join(outDir, filePath);

		const contents = await fs.readFile(inPath);
		const optimizeResult = svgoOptimize(contents, {
			path: inPath,
			multipass: true
		});

		await fs.writeFile(outPath, optimizeResult.data);
	}

	handlesFile(filePath) {
		return filePath.endsWith('.svg');
	}
}

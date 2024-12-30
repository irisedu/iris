import fs from 'fs-extra';
import path from 'path';
import FileInfo from '../../FileInfo.js';
import FileProcessor, { type FileProcessorArgs } from '../../FileProcessor.js';

export default class CatchAllFileProcessor extends FileProcessor {
	override async process({ inDir, outDir, filePath }: FileProcessorArgs) {
		const inPath = path.join(inDir, filePath);
		const outPath = path.join(outDir, filePath);

		await fs.ensureDir(path.dirname(outPath));
		await fs.copyFile(inPath, outPath);

		return new FileInfo(filePath);
	}

	override handlesFile() {
		return true;
	}
}

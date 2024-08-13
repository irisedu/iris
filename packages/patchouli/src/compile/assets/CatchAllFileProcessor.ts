import fs from 'fs-extra';
import path from 'path';
import { VFile } from 'vfile';
import FileProcessor from '../../FileProcessor';

export default class CatchAllFileProcessor extends FileProcessor {
	async process({ inDir, outDir, filePath }) {
		const inPath = path.join(inDir, filePath);
		const outPath = path.join(outDir, filePath);

		await fs.ensureDir(path.dirname(outPath));
		await fs.copyFile(inPath, outPath);

		return new VFile({ path: filePath });
	}

	handlesFile() {
		return true;
	}
}

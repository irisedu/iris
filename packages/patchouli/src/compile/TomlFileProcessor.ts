import fs from 'fs-extra';
import path from 'path';
import FileInfo from '../FileInfo.js';
import toml from '@iarna/toml';
import FileProcessor, { type FileProcessorArgs } from '../FileProcessor.js';

export default class TomlFileProcessor extends FileProcessor {
	override async process({ inDir, outDir, filePath }: FileProcessorArgs) {
		const inPath = path.join(inDir, filePath);
		const outPath = path.join(
			outDir,
			TomlFileProcessor.getOutputPath(filePath)
		);

		const fileInfo = new FileInfo(filePath);
		let data;

		try {
			data = toml.parse(await fs.readFile(inPath, 'utf-8'));
		} catch (e: unknown) {
			fileInfo.message({
				id: 'toml-invalid',
				message: 'Failed to parse TOML: ' + e
			});

			return fileInfo;
		}

		await fs.writeFile(outPath, JSON.stringify(data));
		return fileInfo;
	}

	override handlesFile(filePath: string) {
		return filePath.endsWith('.toml');
	}

	static override getOutputPath(filePath: string) {
		return filePath.slice(0, -5) + '.json';
	}
}

import fs from 'fs-extra';
import path from 'path';
import { VFile } from 'vfile';
import toml from '@iarna/toml';
import { vfileMessage } from '../utils';
import FileProcessor from '../FileProcessor';

export default class TomlFileProcessor extends FileProcessor {
	async process({ inDir, outDir, filePath }) {
		const inPath = path.join(inDir, filePath);
		const outPath = path.join(
			outDir,
			TomlFileProcessor.getOutputPath(filePath)
		);

		const vfile = new VFile({ path: filePath });
		let data;

		try {
			data = toml.parse(await fs.readFile(inPath));
		} catch (e) {
			vfileMessage(
				vfile,
				null,
				'toml-invalid',
				'Failed to parse TOML: ' + e.message
			);
			return vfile;
		}

		await fs.writeFile(outPath, JSON.stringify(data));
		return vfile;
	}

	handlesFile(filePath) {
		return filePath.endsWith('.toml');
	}

	static getOutputPath(filePath) {
		return filePath.slice(0, -5) + '.json';
	}
}

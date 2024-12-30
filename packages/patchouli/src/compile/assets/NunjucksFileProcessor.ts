import fs from 'fs-extra';
import path from 'path';
import FileInfo from '../../FileInfo.js';
import nunjucks from 'nunjucks';
import FileProcessor, { type FileProcessorArgs } from '../../FileProcessor.js';

export default class NunjucksFileProcessor extends FileProcessor {
	override async process({ inDir, outDir, filePath }: FileProcessorArgs) {
		const inPath = path.join(inDir, filePath);
		const outPath = path.join(
			outDir,
			NunjucksFileProcessor.getOutputPath(filePath)
		);

		const fileInfo = new FileInfo(filePath);

		const njkBase = path.join(inDir, this.config.nunjucks.templatePath);
		const env = nunjucks.configure(njkBase, {
			autoescape: false
		});

		// https://github.com/mozilla/nunjucks/issues/788#issuecomment-332183033
		env.addGlobal('includeRaw', (src: string) => {
			let filePath;

			if (src.startsWith('.')) {
				filePath = path.join(path.dirname(inPath), src);
			} else {
				filePath = path.join(njkBase, src);
			}

			return fs.readFileSync(filePath);
		});

		const contents = await fs.readFile(inPath, 'utf-8');

		try {
			const res = env.renderString(contents, {});
			await fs.writeFile(outPath, res);
		} catch (e: unknown) {
			fileInfo.message({
				id: 'njk-compile',
				message: 'Failed to compile Nunjucks file: ' + e
			});
		}

		return fileInfo;
	}

	override handlesFile(filePath: string) {
		return filePath.endsWith('.njk');
	}

	static override getOutputPath(filePath: string) {
		return filePath.slice(0, -4) + '.html';
	}
}

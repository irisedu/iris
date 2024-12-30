import fs from 'fs-extra';
import path from 'path';
import { execFile as execFileCb } from 'node:child_process';
import util from 'node:util';
import FileInfo from '../../FileInfo.js';
import FileProcessor, { type FileProcessorArgs } from '../../FileProcessor.js';

const execFile = util.promisify(execFileCb);

export default class TeXFileProcessor extends FileProcessor {
	override async process({ inDir, outDir, filePath }: FileProcessorArgs) {
		const inPath = path.join(inDir, filePath);
		const outPath = path.join(outDir, filePath);

		const fileInfo = new FileInfo(filePath);

		const inPathParsed = path.parse(inPath);
		const cwd = inPathParsed.dir;

		const outParent = path.dirname(outPath);

		try {
			await execFile('latex', [inPathParsed.name], { cwd });
			const outSpec = path.join(outParent, '%f.svg');

			try {
				await fs.ensureDir(outParent);
				await execFile(
					'dvisvgm',
					[inPathParsed.name, '--no-fonts', '-o', outSpec],
					{ cwd }
				);
			} catch {
				fileInfo.message({
					id: 'latex-compile',
					message: 'Failed to convert LaTeX to SVG'
				});
			}
		} catch {
			fileInfo.message({
				id: 'latex-compile',
				message: 'LaTeX failed to compile'
			});
		}

		return fileInfo;
	}

	override handlesFile(filePath: string) {
		return filePath.endsWith('.tex');
	}

	static override getOutputPath(filePath: string) {
		return filePath.slice(0, -4) + '.svg';
	}
}

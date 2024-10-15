import type FileInfo from './FileInfo.js';
import type { UserConfig } from './config.js';

export interface FileProcessorArgs {
	inDir: string;
	outDir: string;
	filePath: string;
}

export default abstract class FileProcessor {
	protected config: UserConfig;

	constructor(config: UserConfig) {
		this.config = config;
	}

	/**
	 * Process the given file path relative to the project root. Optionally
	 * returns a FileInfo representing the file processed.
	 */
	abstract process(
		args: FileProcessorArgs
	): undefined | FileInfo | Promise<void> | Promise<FileInfo>;

	/**
	 * Returns whether this processor handles the given file path relative to
	 * the project root.
	 */
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	handlesFile(filePath: string) {
		return false;
	}

	/**
	 * Accepts a file path relative to the project root and returns its
	 * corresponding output path relative to the output root.
	 */
	static getOutputPath(filePath: string) {
		return filePath;
	}
}

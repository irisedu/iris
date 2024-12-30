import type FileInfo from '../FileInfo.js';
import type { UserConfig } from '../config.js';

export interface CollectionProcessorArgs {
	inDir: string;
	outDir: string;
	fileInfo: FileInfo[];
}

export default abstract class CollectionProcessor {
	protected config: UserConfig;

	constructor(config: UserConfig) {
		this.config = config;
	}

	/**
	 * Process the collection at the given directory with the given FileInfo and
	 * file map.
	 */
	abstract process(args: CollectionProcessorArgs): undefined | Promise<void>;
}

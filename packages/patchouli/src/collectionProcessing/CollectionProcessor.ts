import type FileInfo from '../FileInfo';

export interface CollectionProcessorArgs {
	inDir: string;
	outDir: string;
	fileInfo: FileInfo[];
	handledFiles: Record<string, string | boolean>;
}

export default abstract class CollectionProcessor {
	config;

	constructor(config) {
		this.config = config;
	}

	/**
	 * Process the collection at the given directory with the given FileInfo and
	 * file map.
	 */
	abstract process(args: CollectionProcessorArgs): void | Promise<void>;
}

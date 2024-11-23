import logger from '../logger.js';
import fs from 'fs-extra';
import path from 'path';
import CollectionProcessor, {
	type CollectionProcessorArgs
} from './CollectionProcessor.js';
import { IriscFile, type IriscNode } from '@irisedu/schemas';

export interface SeriesInfo {
	title: IriscNode[];
	authors: string[];
	tags: string[];
	href: string;
}

export default class SeriesCollectionProcessor extends CollectionProcessor {
	async process({ outDir }: CollectionProcessorArgs) {
		const series: SeriesInfo[] = [];

		const directory = await fs.readdir(outDir, { withFileTypes: true });

		for (const dirent of directory) {
			if (!dirent.isDirectory()) {
				continue;
			}

			const summaryPath = path.join(outDir, dirent.name, 'SUMMARY.irisc');
			if (!(await fs.exists(summaryPath))) {
				continue;
			}

			const summaryData = IriscFile.parse(
				JSON.parse(await fs.readFile(summaryPath, 'utf-8'))
			);

			if (!summaryData.meta.summary) {
				logger.warn(`Series '${dirent.name}' has no summary`);
				continue;
			}

			series.push({
				title: summaryData.meta.title ?? [],
				authors: summaryData.meta.docAttrs?.authors ?? [],
				tags: summaryData.meta.docAttrs?.tags ?? [],
				href: `/page/${dirent.name}`
			});
		}

		const outPath = path.join(outDir, 'series.json');
		await fs.writeFile(outPath, JSON.stringify(series));
	}
}

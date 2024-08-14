import fs from 'fs-extra';
import path from 'path';
import { recurseDirectory } from '../utils';
import CollectionProcessor, {
	type CollectionProcessorArgs
} from './CollectionProcessor';

interface CollectionStats {
	articleCount: number;
	stubs: {
		title: string;
		href: string;
	}[];
}

export default class StatsCollectionProcessor extends CollectionProcessor {
	override async process({ outDir, handledFiles }: CollectionProcessorArgs) {
		const stats: CollectionStats = {
			articleCount: 0,
			stubs: []
		};

		const articleExt = '.md.json';

		await recurseDirectory(outDir, async (filePath) => {
			if (!filePath.endsWith(articleExt)) {
				return;
			}

			stats.articleCount++;

			const articleData = JSON.parse(
				await fs.readFile(path.join(outDir, filePath), 'utf-8')
			);
			if (!articleData.contents.length) {
				stats.stubs.push({
					title: articleData.data.frontmatter.title,
					href: `/page/${filePath.slice(0, -articleExt.length)}`
				});
			}
		});

		const statsPath = path.join(outDir, 'stats.json');

		await fs.writeFile(statsPath, JSON.stringify(stats));

		// Prevent garbage collection
		handledFiles[statsPath] = true;
	}
}

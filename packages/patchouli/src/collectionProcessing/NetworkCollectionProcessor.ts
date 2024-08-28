import fs from 'fs-extra';
import path from 'path';
import { recurseDirectory } from '../utils';
import CollectionProcessor, {
	type CollectionProcessorArgs
} from './CollectionProcessor';

interface NetworkNode {
	id: string;
	href: string;
	[key: string]: unknown;
}

interface NetworkLink {
	source: string;
	target: string;
}

export default class NetworkCollectionProcessor extends CollectionProcessor {
	override async process({ outDir }: CollectionProcessorArgs) {
		const network: {
			nodes: NetworkNode[];
			links: NetworkLink[];
		} = {
			nodes: [],
			links: []
		};

		const backlinks: Record<string, string[]> = {};

		await recurseDirectory(outDir, async (filePath) => {
			const articleExt = '.md.json';

			if (!filePath.endsWith(articleExt)) {
				return;
			}

			const id = filePath.slice(0, -articleExt.length);
			const articleData = JSON.parse(
				await fs.readFile(path.join(outDir, filePath), 'utf-8')
			);

			const node: NetworkNode = {
				id,
				href: `/page/${id}`
			};

			// TODO: Fix for .irisc
			// for (const key of this.config.platform.network.store) {
			// 	node[key] = articleData.data.frontmatter[key];
			// }

			network.nodes.push(node);

			if (articleData.data.links) {
				for (const otherId of articleData.data.links) {
					const links = backlinks[otherId] || (backlinks[otherId] = []);
					links.push(id);

					if (
						network.links.some(
							(l) =>
								(l.source === id && l.target === otherId) ||
								(l.source === otherId && l.target === id)
						)
					) {
						continue;
					}

					network.links.push({
						source: id,
						target: otherId
					});
				}
			}
		});

		const networkPath = path.join(outDir, 'network.json');
		const backlinksPath = path.join(outDir, 'backlinks.json');

		await fs.writeFile(networkPath, JSON.stringify(network));
		await fs.writeFile(backlinksPath, JSON.stringify(backlinks));
	}
}

import fs from 'fs-extra';
import path from 'path';
import { recurseDirectory } from '../utils';
import CollectionProcessor from './CollectionProcessor';

export default class NetworkCollectionProcessor extends CollectionProcessor {
	async process({ outDir, handledFiles }) {
		const network = {
			nodes: [],
			links: []
		};

		const backlinks = {};

		await recurseDirectory(outDir, async (filePath) => {
			const articleExt = '.md.json';

			if (!filePath.endsWith(articleExt)) {
				return;
			}

			const id = filePath.slice(0, -articleExt.length);
			const articleData = JSON.parse(
				await fs.readFile(path.join(outDir, filePath))
			);

			const node = {
				id,
				href: `/page/${id}`
			};

			for (const key of this.config.platform.network.store) {
				node[key] = articleData.data.frontmatter[key];
			}

			network.nodes.push(node);

			if (articleData.data.links) {
				for (const otherId of articleData.data.links) {
					const links = backlinks[otherId] || (backlinks[otherId] = []);
					links.push(id);

					if (
						network.links.some(
							(l) =>
								(l.from === id && l.to === otherId) ||
								(l.from === otherId && l.to === id)
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

		// Prevent garbage collection
		handledFiles[networkPath] = true;
		handledFiles[backlinksPath] = true;
	}
}

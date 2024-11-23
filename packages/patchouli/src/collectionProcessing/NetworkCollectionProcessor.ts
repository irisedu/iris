import fs from 'fs-extra';
import path from 'path';
import { recurseDirectory } from '../utils.js';
import CollectionProcessor, {
	type CollectionProcessorArgs
} from './CollectionProcessor.js';
import { IriscFile, type IriscNode } from '@irisedu/schemas';

interface NetworkNode {
	id: string;
	href: string;
	title: IriscNode[];
	isSummary: boolean;
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
			const articleExt = '.irisc';
			if (!filePath.endsWith(articleExt)) return;

			const summarySuffix = '/SUMMARY' + articleExt;
			const isSummary = filePath.endsWith(summarySuffix);

			const id = filePath
				.slice(0, isSummary ? -summarySuffix.length : -articleExt.length)
				.replace(path.sep, '/');

			const articleData: IriscFile = IriscFile.parse(
				JSON.parse(await fs.readFile(path.join(outDir, filePath), 'utf-8'))
			);

			const node: NetworkNode = {
				id: id,
				href: `/page/${id}`,
				title: articleData.meta.title ?? [],
				isSummary
			};

			network.nodes.push(node);

			if (!articleData.meta.links) return;

			for (const otherId of articleData.meta.links) {
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
		});

		const networkPath = path.join(outDir, 'network.json');
		const backlinksPath = path.join(outDir, 'backlinks.json');

		await fs.writeFile(networkPath, JSON.stringify(network));
		await fs.writeFile(backlinksPath, JSON.stringify(backlinks));
	}
}

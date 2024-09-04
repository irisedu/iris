import fs from 'fs-extra';
import { posix as path } from 'path';
import { internalLinkToPageLink, recurseDirectory } from '../utils';
import CollectionProcessor, {
	type CollectionProcessorArgs
} from './CollectionProcessor';
import type { IriscFile, IriscNode, SummaryNode } from '../compile/docTypes';

export default class IrisCollectionProcessor extends CollectionProcessor {
	override async process({ outDir }: CollectionProcessorArgs) {
		const articleTitles: Record<string, IriscNode[] | null> = {};

		await recurseDirectory(outDir, async (filePath) => {
			const articleExt = '.irisc';
			if (!filePath.endsWith(articleExt)) return;

			const articleData: IriscFile = JSON.parse(
				await fs.readFile(path.join(outDir, filePath), 'utf-8')
			);

			if (!articleData.meta) return;

			if (articleData.meta.title)
				articleTitles[filePath.slice(0, -articleExt.length)] =
					articleData.meta.title;

			if (!Array.isArray(articleData.meta.summary)) return;

			async function processNode(node: SummaryNode) {
				if (Array.isArray(node.children))
					await Promise.all(node.children.map(processNode));

				if (!node.hrefInternal) return;

				const id = node.hrefInternal.slice(1);
				const existingTitle = articleTitles[id];

				if (existingTitle) {
					node.title = existingTitle;
				} else if (existingTitle !== null) {
					const fullPath = path.join(outDir, node.hrefInternal + articleExt);
					if (await fs.exists(fullPath)) {
						const titleData: IriscFile = JSON.parse(
							await fs.readFile(fullPath, 'utf-8')
						);

						if (titleData.meta && titleData.meta.title) {
							articleTitles[id] = titleData.meta.title;
							node.title = titleData.meta.title;
						}
					} else {
						articleTitles[id] = null;
					}
				}

				node.href = internalLinkToPageLink(node.hrefInternal);
			}

			for (const node of articleData.meta.summary) {
				await processNode(node);
			}

			await fs.writeFile(
				path.join(outDir, filePath),
				JSON.stringify(articleData)
			);
		});
	}
}

import fs from 'fs-extra';
import path from 'path';
import { internalLinkToPageLink, recurseDirectory } from '../utils.js';
import CollectionProcessor, {
	type CollectionProcessorArgs
} from './CollectionProcessor.js';
import { IriscFile, type IriscNode, type SummaryNode } from '@irisedu/schemas';

const articleExt = '.irisc';

function getSummaryNodes(toc: SummaryNode[]) {
	const nodes: SummaryNode[] = [];

	function addSummaryNode(node: SummaryNode) {
		if (node.children) node.children.forEach(addSummaryNode);
		nodes.push(node);
	}

	toc.forEach(addSummaryNode);

	return nodes;
}

type FetchTitleCb = (
	id: string,
	filePath: string
) => Promise<IriscNode[] | null>;

async function addSummaryTitles(
	outDir: string,
	summaryNodes: SummaryNode[],
	fetchTitle: FetchTitleCb
) {
	if (!summaryNodes.length) return;

	for (const node of summaryNodes) {
		if (!node.hrefInternal) continue;

		const id = node.hrefInternal.slice(1);
		const fullPath = path.join(outDir, node.hrefInternal + articleExt);

		node.title = (await fetchTitle(id, fullPath)) ?? undefined;
		node.href = internalLinkToPageLink(node.hrefInternal);
	}
}

async function findUnlinkedPages(
	outDir: string,
	filePath: string,
	articleData: IriscFile,
	summaryNodes: SummaryNode[],
	fetchTitle: FetchTitleCb
) {
	if (!summaryNodes.length) return;

	const series = path.dirname(filePath);
	const searchDir = path.join(outDir, series);

	const linkedPages = new Set(
		summaryNodes
			.map((n) => n.hrefInternal?.slice(1))
			.filter((href) => href !== undefined)
	);
	const unlinkedPages: SummaryNode[] = [];

	await recurseDirectory(searchDir, async (filePath) => {
		const filePathParsed = path.parse(filePath);
		if (filePathParsed.name === 'SUMMARY' || filePathParsed.ext !== articleExt)
			return;

		const filePathNoExt = path.join(filePathParsed.dir, filePathParsed.name);
		const id = series + '/' + filePathNoExt.replaceAll(path.sep, '/');

		if (!linkedPages.has(id))
			unlinkedPages.push({
				title:
					(await fetchTitle(id, path.join(searchDir, filePath))) ?? undefined,
				href: internalLinkToPageLink('/' + id)
			});
	});

	articleData.meta.unlinkedPages = unlinkedPages.length
		? [
				{
					children: unlinkedPages
				}
			]
		: [];
}

export default class IrisCollectionProcessor extends CollectionProcessor {
	override async process({ outDir }: CollectionProcessorArgs) {
		const articleTitles: Record<string, IriscNode[] | null> = {};

		async function fetchTitle(id: string, filePath: string) {
			const existing = articleTitles[id];

			if (existing) {
				return existing;
			} else if (existing !== null) {
				if (await fs.exists(filePath)) {
					const titleData = IriscFile.parse(
						JSON.parse(await fs.readFile(filePath, 'utf-8'))
					);

					if (titleData.meta && titleData.meta.title) {
						articleTitles[id] = titleData.meta.title;
						return titleData.meta.title;
					}
				} else {
					articleTitles[id] = null;
				}
			}

			return null;
		}

		await recurseDirectory(outDir, async (filePath) => {
			if (!filePath.endsWith(articleExt)) return;

			const articleData = IriscFile.parse(
				JSON.parse(await fs.readFile(path.join(outDir, filePath), 'utf-8'))
			);

			if (!articleData.meta) return;

			const summaryNodes = articleData.meta.summary
				? getSummaryNodes(articleData.meta.summary)
				: [];

			if (articleData.meta.title)
				articleTitles[filePath.slice(0, -articleExt.length)] =
					articleData.meta.title;

			// Currently must be processed as a collection in case dependencies are updated
			await addSummaryTitles(outDir, summaryNodes, fetchTitle);
			await findUnlinkedPages(
				outDir,
				filePath,
				articleData,
				summaryNodes,
				fetchTitle
			);

			await fs.writeFile(
				path.join(outDir, filePath),
				JSON.stringify(articleData)
			);
		});
	}
}

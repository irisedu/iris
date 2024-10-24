import fs from 'fs-extra';
import path from 'path';
import FileInfo from '../FileInfo.js';
import FileProcessor, { type FileProcessorArgs } from '../FileProcessor.js';
import type {
	IrisFile,
	IrisNode,
	IriscFile,
	IriscNode,
	IriscMetadata,
	SummaryNode,
	TocNode
} from './docTypes.d.ts';
import { resolveInternalLink, internalLinkToPageLink } from '../utils.js';
import GithubSlugger from 'github-slugger';
import KaTeX from 'katex';

interface ProcessorCtx {
	headings: {
		slugger: GithubSlugger;
		currentStack: { rank: number; data: TocNode }[];
	};
}

function processList(
	listNode: IrisNode,
	children: SummaryNode[],
	fileInfo: FileInfo
) {
	if (!Array.isArray(listNode.content)) return;

	for (const li of listNode.content) {
		if (!Array.isArray(li.content)) continue;

		const page = li.content[0];
		if (page.type !== 'summary_page' || !Array.isArray(page.content)) continue;

		const pageText = page.content[0];
		if (pageText.type !== 'text' || !pageText.text) continue;

		const link: SummaryNode = {};

		const internalLink = resolveInternalLink(
			'$' + pageText.text,
			fileInfo.path
		);
		if (internalLink) link.hrefInternal = internalLink;
		else link.href = pageText.text;

		for (const liChild of li.content.slice(1)) {
			if (liChild.type !== 'summary_list' || !Array.isArray(liChild.content))
				continue;

			const linkChildren = link.children || (link.children = []);
			processList(liChild, linkChildren, fileInfo);
		}

		children.push(link);
	}
}

// Naive conversion to string, for inline content
function nodesToString(nodes: IriscNode[]) {
	return nodes
		.map((n) => {
			if (n.type === 'text') {
				return n.text ?? '';
			} else if (n.type === 'nbsp') {
				return ' ';
			} else if (n.type === 'math_inline') {
				return n.html?.raw ? `$${n.html.raw}$` : '';
			}

			return '';
		})
		.join('');
}

const nodeProcessors: Record<
	string,
	(
		node: IrisNode,
		meta: IriscMetadata,
		fileInfo: FileInfo,
		ctx: ProcessorCtx
	) => [IriscNode | null, boolean]
> = {
	frontmatter() {
		return [null, true];
	},
	title(node, meta, fileInfo, ctx) {
		if (node.content && Array.isArray(node.content)) {
			meta.title = processIrisNodes(node.content, meta, fileInfo, ctx);
			meta.titleString = nodesToString(meta.title);
		}

		return [null, false];
	},
	frontmatter_attributes(node, meta) {
		if (node.attrs && node.attrs.data) {
			meta.docAttrs = node.attrs.data;
		}

		return [null, false];
	},
	summary(node, meta, fileInfo, ctx) {
		const summary: SummaryNode[] = [];

		let section: SummaryNode | undefined;

		if (node.content && Array.isArray(node.content)) {
			for (const child of node.content) {
				if (child.type === 'summary_heading') {
					if (section) {
						summary.push(section);
					}

					section = {
						title: Array.isArray(child.content)
							? processIrisNodes(child.content, meta, fileInfo, ctx)
							: []
					};
				} else if (child.type === 'summary_list') {
					if (!section) {
						section = {};
					}

					const children = section.children || (section.children = []);
					processList(child, children, fileInfo);
				}
			}
		}

		if (section) summary.push(section);

		meta.summary = summary;

		return [{ type: 'summary' }, false];
	},
	heading(node, meta, fileInfo, ctx) {
		const { slugger, currentStack } = ctx.headings;
		const rank = node.attrs?.level;
		if (typeof rank !== 'number' || !Array.isArray(node.content))
			return [node, true];

		const headingContent = processIrisNodes(node.content, meta, fileInfo, ctx);
		const headingId = slugger.slug(nodesToString(headingContent));
		const heading = {
			rank,
			data: {
				id: headingId,
				content: headingContent
			}
		};

		while (currentStack.length && currentStack.at(-1)!.rank >= rank) {
			currentStack.pop();
		}

		if (currentStack.length) {
			const children =
				currentStack.at(-1)!.data.children ||
				(currentStack.at(-1)!.data.children = []);
			children.push(heading.data);
		} else {
			(meta.toc ?? (meta.toc = [])).push(heading.data);
		}

		currentStack.push(heading);

		return [
			{
				...node,
				html: {
					id: headingId
				}
			},
			true
		];
	},
	text(node, meta, fileInfo) {
		if (!Array.isArray(node.marks)) return [node, false];

		const mathMark = node.marks.find((m) => m.type === 'math_inline');
		if (mathMark) {
			const textContent = node.text ?? '';
			const html = KaTeX.renderToString(textContent, {
				displayMode: false,
				throwOnError: false
			});

			return [
				{
					type: 'math_inline',
					html: {
						code: html,
						raw: textContent
					}
				},
				false
			];
		}

		const linkMark = node.marks.find((m) => m.type === 'link');
		if (linkMark) {
			const href = linkMark.attrs?.href;
			if (typeof href !== 'string') return [node, false];

			const internalLink = resolveInternalLink(href, fileInfo.path);
			if (!internalLink) return [node, false];

			const links = meta.links || (meta.links = []);
			const hashSplit = internalLink.slice(1).split('#');
			if (hashSplit.length > 1) {
				links.push(hashSplit.slice(0, -1).join('#'));
			} else {
				links.push(hashSplit[0]);
			}

			return [
				{
					...node,
					marks: node.marks.map((m) => {
						if (m === linkMark) {
							return {
								...linkMark,
								attrs: {
									...node.attrs,
									href: internalLinkToPageLink(internalLink),
									internalLink: true
								}
							};
						}

						return m;
					})
				},
				false
			];
		}

		return [node, false];
	},
	math_display(node) {
		if (!Array.isArray(node.content) || node.content.length === 0)
			return [null, false];

		const text = node.content[0];
		if (text.type !== 'text') return [null, false];

		const textContent = text.text ?? '';

		const html = KaTeX.renderToString(textContent, {
			displayMode: true,
			throwOnError: false
		});

		return [
			{
				type: 'math_display',
				html: {
					code: html,
					raw: textContent
				}
			},
			false
		];
	},
	image(node, _, fileInfo) {
		const src = node.attrs?.src;
		if (typeof src !== 'string') return [node, false];

		const internalLink = resolveInternalLink(src, fileInfo.path);
		if (internalLink) {
			return [
				{
					...node,
					attrs: {
						...node.attrs,
						src: internalLinkToPageLink(internalLink)
					}
				},
				false
			];
		}

		return [node, false];
	}
};

function processIrisNode(
	node: IrisNode,
	meta: IriscMetadata,
	fileInfo: FileInfo,
	ctx: ProcessorCtx
): IriscNode | null {
	if (!node.type) {
		fileInfo.message({
			id: 'iris-file-corrupted',
			message: 'Iris file is corrupted: node type missing'
		});

		return null;
	}

	let newNode: IriscNode | null = node;
	let recurse = true;

	const proc = nodeProcessors[node.type];
	if (proc) {
		[newNode, recurse] = proc(node, meta, fileInfo, ctx);
	}

	// Allow recursion with no output (e.g. for frontmatter)
	if (node.content && recurse) {
		if (!Array.isArray(node.content)) {
			fileInfo.message({
				id: 'iris-file-corrupted',
				message: 'Iris file is corrupted: content is not an array'
			});

			return null;
		}

		const content = processIrisNodes(node.content, meta, fileInfo, ctx);
		if (newNode) newNode.content = content;
	}

	return newNode;
}

function processIrisNodes(
	nodes: IrisNode[],
	meta: IriscMetadata,
	fileInfo: FileInfo,
	ctx: ProcessorCtx
): IriscNode[] {
	return nodes
		.map((n) => processIrisNode(n, meta, fileInfo, ctx))
		.filter((n) => n !== null);
}

export default class IrisFileProcessor extends FileProcessor {
	override async process({ inDir, outDir, filePath }: FileProcessorArgs) {
		const inPath = path.join(inDir, filePath);
		const outPath = path.join(
			outDir,
			IrisFileProcessor.getOutputPath(filePath)
		);

		const fileInfo = new FileInfo(filePath);

		let data: IrisFile;

		try {
			data = JSON.parse(await fs.readFile(inPath, 'utf-8'));
		} catch (e: unknown) {
			fileInfo.message({
				id: 'iris-file-invalid',
				message: 'Failed to parse Iris file: ' + e
			});

			return fileInfo;
		}

		if (data.version !== 1) {
			fileInfo.message({
				id: 'iris-version-mismatch',
				message: `Invalid Iris file version (${data.version})`
			});

			return fileInfo;
		}

		const ctx: ProcessorCtx = {
			headings: {
				slugger: new GithubSlugger(),
				currentStack: []
			}
		};

		const meta: IriscMetadata = {};
		const newData = processIrisNode(data.data, meta, fileInfo, ctx);

		if (!newData) {
			fileInfo.message({
				id: 'iris-no-output',
				message: 'Iris compiler output is empty'
			});

			return fileInfo;
		}

		const newFile: IriscFile = { meta, data: newData };

		await fs.ensureDir(path.dirname(outPath));
		await fs.writeFile(outPath, JSON.stringify(newFile));
		return fileInfo;
	}

	override handlesFile(filePath: string) {
		return filePath.endsWith('.iris');
	}

	static override getOutputPath(filePath: string) {
		return filePath.slice(0, -5) + '.irisc';
	}
}

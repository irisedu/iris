import { z } from 'zod';
import { IrisMark, IrisNodeBase } from './prosemirror.js';

// Mark

export const IriscMark = IrisMark;
export type IriscMark = z.infer<typeof IriscMark>;

// Node

const IriscNodeBase = IrisNodeBase.extend({
	marks: z.optional(IriscMark.array()),
	html: z.optional(
		z.object({
			id: z.optional(z.string()),

			raw: z.optional(z.string()), // Uncompiled, e.g. TeX
			code: z.optional(z.string()) // HTML code
		})
	)
});

export type IriscNode = z.infer<typeof IriscNodeBase> & {
	content?: IriscNode[];
};

export const IriscNode: z.ZodType<IriscNode> = IriscNodeBase.extend({
	content: z.lazy(() => z.optional(IriscNode.array()))
});

// Summary

const SummaryNodeBase = z.object({
	title: z.optional(IriscNode.array()),
	href: z.optional(z.string()),
	hrefInternal: z.optional(z.string()) // Internal link
});

export type SummaryNode = z.infer<typeof SummaryNodeBase> & {
	children?: SummaryNode[];
};

export const SummaryNode: z.ZodType<SummaryNode> = SummaryNodeBase.extend({
	children: z.lazy(() => z.optional(SummaryNode.array()))
});

// Table of contents

const TocNodeBase = z.object({
	content: IriscNode.array(),
	id: z.string()
});

export type TocNode = z.infer<typeof TocNodeBase> & {
	children?: TocNode[];
};

export const TocNode: z.ZodType<TocNode> = TocNodeBase.extend({
	children: z.lazy(() => z.optional(TocNode.array()))
});

// Metadata

export const IriscMetadata = z.object({
	title: z.optional(IriscNode.array()),
	titleString: z.optional(z.string()),
	docAttrs: z.optional(
		z.object({
			authors: z.optional(z.string().array()),
			tags: z.optional(z.string().array())
		})
	),
	summary: z.optional(SummaryNode.array()),
	unlinkedPages: z.optional(SummaryNode.array()),
	toc: z.optional(TocNode.array()),
	links: z.optional(z.string().array())
});

export type IriscMetadata = z.infer<typeof IriscMetadata>;

// File

export const IriscFile = z.object({
	meta: IriscMetadata,
	data: IriscNode.array()
});

export type IriscFile = z.infer<typeof IriscFile>;

// Naive conversion to string, for inline content
export function nodesToString(nodes: IriscNode[]): string {
	return nodes
		.map((n) => {
			if (n.type === 'text') {
				return n.text ?? '';
			} else if (n.type === 'nbsp') {
				return ' ';
			} else if (n.type === 'math_inline') {
				return n.html?.raw ? `$${n.html.raw}$` : '';
			} else if (n.content) {
				return nodesToString(n.content) + '\n';
			}

			return '';
		})
		.join('');
}

function parseAddress(addr: string): number[] {
	return addr.split('.').map((n) => parseInt(n));
}

export interface TextRange {
	text: string;
	context?: string;
	commonAncestor: IriscNode;
}

function getLowerBoundText(commonAncestor: IriscNode, addr: number[]): string {
	function getLowerBoundRecursive(node: IriscNode, addr: number[]): string {
		if (!addr.length) return '';
		if (node.type === 'text') {
			return (node.text ?? '').slice(addr[0]);
		}

		if (!node.content) return '';

		return (
			getLowerBoundRecursive(node.content[addr[0]], addr.slice(1)) +
			nodesToString(node.content.slice(addr[0] + 1))
		);
	}

	if (!commonAncestor.content) return '';

	return getLowerBoundRecursive(commonAncestor.content[addr[0]], addr.slice(1));
}

function getUpperBoundText(commonAncestor: IriscNode, addr: number[]): string {
	function getUpperBoundRecursive(node: IriscNode, addr: number[]): string {
		if (!addr.length) return '';
		if (node.type === 'text') {
			return (node.text ?? '').slice(0, addr[0]);
		}

		if (!node.content) return '';

		return (
			getUpperBoundRecursive(node.content[addr[0]], addr.slice(1)) +
			nodesToString(node.content.slice(0, addr[0]))
		);
	}

	if (!commonAncestor.content) return '';

	return getUpperBoundRecursive(commonAncestor.content[addr[0]], addr.slice(1));
}

export function getTextRange(
	doc: IriscNode[],
	a: string,
	b: string
): TextRange | null {
	if (!a.length || !b.length) return null;

	const addrA = parseAddress(a);
	const addrB = parseAddress(b);

	// Find common ancestor
	let i = 0;
	let commonAncestor: IriscNode = { type: 'doc', content: doc };
	let commonAncestorNonText: IriscNode | undefined;

	while (
		i < addrA.length &&
		i < addrB.length &&
		addrA[i] === addrB[i] &&
		commonAncestor.type !== 'text'
	) {
		if (!commonAncestor.content || addrA[i] >= commonAncestor.content.length)
			return null;

		const newCommonAncestor = commonAncestor.content[addrA[i]];
		if (newCommonAncestor.type === 'text')
			commonAncestorNonText = commonAncestor;

		commonAncestor = newCommonAncestor;
		i++;
	}

	// Entire node
	if (i === addrA.length && i === addrB.length) {
		return {
			text: nodesToString([commonAncestor]).trimEnd(),
			commonAncestor: commonAncestorNonText ?? commonAncestor
		};
	}

	// Partial selection:
	// A: ... a b c d e ...
	// B: ... a b x y z ...
	// If the common ancestor is text, the range is trivial.
	// Otherwise, interested in nodes in the common ancestor from index c thru x.
	// A: Grab content d..., e..., etc.
	// Middle: Convert everything from c + 1 to x - 1 (incl) to text directly.
	// B: Grab content ...y, ...z, etc. For text, non-inclusive.

	let text: string;

	if (commonAncestor.type === 'text') {
		text = commonAncestor.text?.slice(addrA[i], addrB[i]) ?? '';
	} else {
		const textA = getLowerBoundText(commonAncestor, addrA.slice(i));
		const textMid = nodesToString(
			commonAncestor.content?.slice(addrA[i] + 1, addrB[i]) ?? []
		);
		const textB = getUpperBoundText(commonAncestor, addrB.slice(i));

		text = textA + textMid + textB;
	}

	let context: string;

	const contextAncestor = commonAncestorNonText ?? commonAncestor;
	if (contextAncestor.type === 'paragraph') {
		context = nodesToString([contextAncestor]);
	} else {
		context = nodesToString(
			contextAncestor.content?.slice(addrA[i], addrB[i] + 1) ?? []
		);
	}

	return {
		text: text.trimEnd(),
		context: context.trimEnd(),
		commonAncestor: commonAncestorNonText ?? commonAncestor
	};
}

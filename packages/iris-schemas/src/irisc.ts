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
				return nodesToString(n.content);
			}

			return '';
		})
		.join('');
}

/* INPUT */

export interface IrisMark {
	type: string;
	attrs?: Record<string, unknown>;
}

export interface IrisNode {
	type: string;
	attrs?: Record<string, unknown>;
	marks?: IrisMark[];
	content?: IrisNode[];
	text?: string;
}

export interface IrisFile {
	version: number;
	data: IrisNode;
}

/* OUTPUT */

export type IriscMark = IrisMark;

export type IriscNode = IrisNode & {
	marks?: IriscMark[];
	html?: {
		id?: string;

		raw?: string;
		code?: string;
	};
};

export interface SummaryNode {
	title?: IriscNode[];
	href?: string;
	hrefInternal?: string;
	children?: SummaryNode[];
}

export interface TocNode {
	content: IriscNode[];
	id: string;
	children?: TocNode[];
}

export interface IriscMetadata {
	title?: IriscNode[];
	titleString?: string;
	docAttrs?: {
		authors?: string[];
		tags?: string[];
	};
	summary?: SummaryNode[];
	toc?: TocNode[];
	links?: string[];
}

export interface IriscFile {
	meta: IriscMetadata;
	data: IriscNode;
}

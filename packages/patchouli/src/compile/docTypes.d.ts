/* INPUT */

export interface IrisMark {
	type: string;
	attrs?: Record<string, object>;
}

export interface IrisNode {
	type: string;
	attrs?: Record<string, object>;
	marks?: IrisMark[];
	content?: IrisNode[];
	text?: string;
}

export interface IrisFile {
	version: number;
	data: IrisNode;
}

/* OUTPUT */

export type IriscNode = IrisNode & {
	html?: {
		id?: string;
	};
};

export interface SummaryNode {
	title?: IriscNode[];
	href?: string;
	hrefInternal?: string;
	topLevel?: boolean;
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
}

export interface IriscFile {
	meta: IriscMetadata;
	data: IriscNode;
}

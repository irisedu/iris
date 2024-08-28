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

export type IriscNode = IrisNode;

export interface SummaryNode {
	title?: IriscNode[];
	href?: string;
	hrefInternal?: string;
	topLevel?: boolean;
	children?: SummaryNode[];
}

export interface IriscMetadata {
	title?: IriscNode[];
	docAttrs?: {
		authors?: string[];
		tags?: string[];
	};
	summary?: SummaryNode[];
}

export interface IriscFile {
	meta: IriscMetadata;
	data: IriscNode;
}

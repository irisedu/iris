import { Fragment, ReactNode } from 'react';
import type {
	IriscNode,
	IriscMark,
	SummaryNode,
	IriscMetadata
} from 'patchouli';
import deepEqual from 'deep-equal';
import { Link as AriaLink } from 'react-aria-components';
import { Link } from 'react-router-dom';
import { goToAnchor } from '$components/utils';
import parse from 'html-react-parser';

import { useSelector } from 'react-redux';
import { type RootState } from '$state/store';

function InlineNode({ node, meta }: { node: IriscNode; meta: IriscMetadata }) {
	switch (node.type) {
		case 'text':
			return node.text ?? '';
		case 'nbsp':
			return '\u00A0';
		case 'hard_break':
			return <br />;

		case 'math_inline':
			return node.html?.code && parse(node.html.code);

		case 'sidenote': {
			const numbered = node.attrs?.numbered as boolean;
			const uuid = crypto.randomUUID();
			const id = `sn-${uuid.split('-')[0]}`;

			return (
				<>
					<label
						className={`sidenote-toggle${numbered ? ' sidenote--numbered' : ''}`}
						htmlFor={id}
					></label>
					<input className="sidenote-checkbox" id={id} type="checkbox" />
					<span className={`sidenote${numbered ? ' sidenote--numbered' : ''}`}>
						{node.content && (
							<IriscBlockContent nodes={node.content} meta={meta} />
						)}
					</span>
				</>
			);
		}
	}

	return null;
}

function Mark({ mark, children }: { mark: IriscMark; children: ReactNode }) {
	switch (mark.type) {
		case 'link': {
			const href = mark.attrs?.href ? String(mark.attrs.href) : '';

			if (href.startsWith('#')) {
				return (
					<AriaLink onPress={() => goToAnchor(href.slice(1))}>
						{children}
					</AriaLink>
				);
			} else if (mark.attrs?.internalLink) {
				return <Link to={href}>{children}</Link>;
			} else {
				let isExternal = false;

				try {
					new URL(href);
					isExternal = true;
				} catch {
					// Nothing
				}

				return (
					<AriaLink
						href={href}
						className={`react-aria-Link${isExternal ? ' external' : ''}`}
					>
						{children}
					</AriaLink>
				);
			}
		}

		case 'italic':
			return <em>{children}</em>;
		case 'bold':
			return <strong>{children}</strong>;
		case 'underline':
			return <u>{children}</u>;
		case 'strikethrough':
			return <s>{children}</s>;
		case 'superscript':
			return <sup>{children}</sup>;
		case 'subscript':
			return <sub>{children}</sub>;
		case 'small_caps':
			return <span className="font-smallcaps">{children}</span>;
		case 'code':
			return <code>{children}</code>;
	}

	return children;
}

// Adjacent marks need to be grouped based on their order of definition in a
// node. This is especially important for links.
export function IriscInlineContent({
	nodes,
	meta,
	markStart = 0
}: {
	nodes: IriscNode[];
	meta: IriscMetadata;
	markStart?: number;
}) {
	const output: ReactNode[] = [];
	let currentMark: IriscMark | undefined;
	let partition: IriscNode[] = [];

	function popPartition() {
		if (!partition.length) return;

		if (currentMark)
			output.push(
				<Mark key={output.length} mark={currentMark}>
					<IriscInlineContent
						nodes={partition}
						meta={meta}
						markStart={markStart + 1}
					/>
				</Mark>
			);

		partition = [];
	}

	for (const node of nodes) {
		if (
			partition.length &&
			currentMark &&
			(!node.marks?.length ||
				markStart >= node.marks.length ||
				!deepEqual(node.marks[markStart], currentMark))
		) {
			popPartition();
		}

		if (node.marks?.length && markStart < node.marks.length) {
			currentMark = node.marks[markStart];
			partition.push(node);
		} else {
			output.push(<InlineNode key={output.length} node={node} meta={meta} />);
		}
	}

	popPartition();

	return output;
}

export function IriscBlockContent({
	nodes,
	meta
}: {
	nodes: IriscNode[];
	meta: IriscMetadata;
}) {
	return nodes.map((n, i) => <IriscNode key={i} node={n} meta={meta} />);
}

// https://github.com/ProseMirror/prosemirror-tables/blob/master/src/tableview.ts
// Copyright (C) 2015-2016 by Marijn Haverbeke <marijnh@gmail.com> and others (MIT)
const cellMinWidth = 25;
function tableSize(table: IriscNode) {
	let totalWidth = 0;
	let fixedWidth = true;
	const widths: (number | null)[] = [];

	if (!Array.isArray(table.content) || table.content.length === 0) return null;

	const row = table.content[0];
	if (row.type !== 'table_row' || !Array.isArray(row.content)) return null;

	for (const child of row.content) {
		const { colspan, colwidth }: { colspan?: number; colwidth?: number[] } =
			child.attrs ?? {};

		for (let i = 0; i < (colspan ?? 1); i++) {
			const hasWidth = colwidth && colwidth[i];
			totalWidth += hasWidth || cellMinWidth;

			if (hasWidth) {
				widths.push(hasWidth);
			} else {
				widths.push(null);
				fixedWidth = false;
			}
		}
	}

	const tableStyle = { width: '', minWidth: '' };

	if (fixedWidth) {
		tableStyle.width = totalWidth + 'px';
	} else {
		tableStyle.minWidth = totalWidth + 'px';
	}

	return { widths, style: tableStyle };
}

function SummaryList({
	nodes,
	meta
}: {
	nodes: SummaryNode[];
	meta: IriscMetadata;
}) {
	return (
		<ul className="list-none">
			{nodes.map((node, i) => {
				const contents = (
					<IriscInlineContent nodes={node.title ?? []} meta={meta} />
				);

				return (
					<li key={i}>
						<Link to={node.href ?? ''}>{contents}</Link>
						{node.children && <SummaryList nodes={node.children} meta={meta} />}
					</li>
				);
			})}
		</ul>
	);
}

export function Summary({
	summary,
	meta
}: {
	summary: SummaryNode[];
	meta: IriscMetadata;
}) {
	return (
		<div>
			{summary.map((node, i) => (
				<Fragment key={i}>
					{node.title && <IriscInlineContent nodes={node.title} meta={meta} />}
					{node.children && <SummaryList nodes={node.children} meta={meta} />}
				</Fragment>
			))}
		</div>
	);
}

export function IriscNode({
	node,
	meta
}: {
	node: IriscNode;
	meta: IriscMetadata;
}) {
	const devEnabled = useSelector((state: RootState) => state.dev.enabled);
	const devHost = useSelector((state: RootState) => state.dev.host);

	function getBlockContent() {
		return (
			node.content && <IriscBlockContent nodes={node.content} meta={meta} />
		);
	}

	function getInlineContent() {
		return (
			node.content && <IriscInlineContent nodes={node.content} meta={meta} />
		);
	}

	switch (node.type) {
		case 'doc':
			return getBlockContent();
		case 'paragraph':
			return <p>{getInlineContent()}</p>;
		case 'heading': {
			const id = node.html?.id;
			const level = node.attrs?.level;

			const children = (
				<>
					{id && (
						<AriaLink onPress={() => goToAnchor(id)}>
							<span className="anchor-link"></span>
						</AriaLink>
					)}
					{getInlineContent()}
				</>
			);

			if (level === 2) {
				return <h2 id={id}>{children}</h2>;
			} else if (level === 3) {
				return <h3 id={id}>{children}</h3>;
			} else if (level === 4) {
				return <h4 id={id}>{children}</h4>;
			}

			break;
		}

		case 'horizontal_rule':
			return <hr />;
		case 'code_block': {
			const language = node.attrs?.language;
			if (typeof language !== 'string') return null;

			return (
				<pre key={Math.random() * 10000}>
					<code
						className={
							language && language.length ? `language-${language}` : ''
						}
					>
						{getInlineContent()}
					</code>
				</pre>
			);
		}

		case 'figure': {
			const float = node.attrs?.float;
			const width = node.attrs?.width;
			const domClasses: Record<string, string> = {
				left: 'figure-left',
				right: 'figure-right'
			};

			const domClass =
				typeof float === 'string' && float.length
					? domClasses[float]
					: undefined;

			const domStyle = width ? { width: String(width) } : undefined;

			return (
				<figure className={domClass} style={domStyle}>
					{getBlockContent()}
				</figure>
			);
		}
		case 'figure_caption': {
			return <figcaption>{getInlineContent()}</figcaption>;
		}
		case 'image': {
			const src = node.attrs?.src;
			const alt = node.attrs?.alt;
			if (src === undefined || alt === undefined) return null;

			return devEnabled && String(src).startsWith('/') ? (
				<picture>
					<source srcSet={'http://' + devHost + String(src)} />
					<img src={String(src)} alt={String(alt)} />
				</picture>
			) : (
				<img src={String(src)} alt={String(alt)} />
			);
		}

		case 'ordered_list':
			return <ol>{getBlockContent()}</ol>;
		case 'bullet_list':
			return <ul>{getBlockContent()}</ul>;
		case 'list_item':
			return <li>{getBlockContent()}</li>;

		case 'table': {
			const sizeData = tableSize(node);
			return (
				<div className="max-w-full overflow-auto">
					<table style={sizeData?.style}>
						{sizeData && (
							<colgroup>
								{sizeData.widths.map((w, i) => (
									<col key={i} style={w ? { width: w + 'px' } : undefined} />
								))}
							</colgroup>
						)}
						<tbody>{getBlockContent()}</tbody>
					</table>
				</div>
			);
		}
		case 'table_row':
			return <tr>{getBlockContent()}</tr>;
		case 'table_cell':
			return (
				<td
					colSpan={node.attrs?.colspan as number | undefined}
					rowSpan={node.attrs?.rowspan as number | undefined}
					style={{
						textAlign: String(node.attrs?.justify ?? 'left') as
							| 'left'
							| 'center'
							| 'right'
					}}
				>
					{getBlockContent()}
				</td>
			);
		case 'table_header':
			return (
				<th
					colSpan={node.attrs?.colspan as number | undefined}
					rowSpan={node.attrs?.rowspan as number | undefined}
					style={{
						textAlign: String(node.attrs?.justify ?? 'left') as
							| 'left'
							| 'center'
							| 'right'
					}}
				>
					{getBlockContent()}
				</th>
			);

		case 'math_display':
			return node.html?.code && parse(node.html.code);

		case 'summary':
			if (!meta.summary) return null;
			return (
				<>
					<h2>Contents</h2>
					<Summary summary={meta.summary} meta={meta} />
				</>
			);
	}
}

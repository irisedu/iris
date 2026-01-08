import { Fragment, ReactNode } from 'react';
import type {
	IriscNode as IriscNodeT,
	IriscMark,
	SummaryNode,
	IriscMetadata
} from '@irisedu/schemas';
import deepEqual from 'deep-equal';
import { goToAnchor, Link as AriaLink, Input } from 'iris-components';
import { Link } from 'react-router-dom';
import Image from './Image';
import parse from 'html-react-parser';
import { NetQuestionComponent } from '$components/QuestionComponent';
import HintPrompt from '$components/HintPrompt';

import Info from '~icons/tabler/info-circle';
import Warning from '~icons/tabler/alert-triangle';
import Tip from '~icons/tabler/star';
import Problem from '~icons/tabler/zoom-question';
import Exercise from '~icons/tabler/pencil';

export interface IriscContext {
	meta?: IriscMetadata;

	getBlankValue?: (id: string) => string;
	setBlankValue?: (id: string, val: string) => void;
	getBlankValidator?: (id: string) => string | undefined;
	getBlankValidatorMessage?: (id: string) => string | undefined;
}

function InlineNode({
	node,
	ctx,
	index
}: {
	node: IriscNodeT;
	ctx?: IriscContext;
	index?: number;
}) {
	const props = {
		'data-index': index
	};

	switch (node.type) {
		case 'text':
			return <span {...props}>{node.text ?? ''}</span>;
		case 'nbsp':
			return '\u00A0';
		case 'hard_break':
			return <br />;

		case 'math_inline':
			return node.html?.code && <span {...props}>{parse(node.html.code)}</span>;

		case 'fill_in_blank': {
			const id = node.attrs?.id as string;
			if (!id) return null;

			return (
				<Input
					className="w-[16ch] border-b-2 border-iris-400 data-[focused]:border-iris-600 bg-iris-100 px-0.5 my-0.5"
					aria-label="Fill in the blank response"
					required
					value={ctx?.getBlankValue && ctx.getBlankValue(id)}
					onChange={(e) =>
						ctx?.setBlankValue && ctx.setBlankValue(id, e.target.value)
					}
					pattern={ctx?.getBlankValidator && ctx.getBlankValidator(id)}
					title={
						ctx?.getBlankValidatorMessage && ctx.getBlankValidatorMessage(id)
					}
				/>
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
						target={isExternal ? '_blank' : '_self'}
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
	ctx,
	markStart = 0,
	indexOffset = 0
}: {
	nodes: IriscNodeT[];
	ctx?: IriscContext;
	markStart?: number;
	indexOffset?: number;
}) {
	const output: ReactNode[] = [];
	let currentMark: IriscMark | undefined;
	let partition: IriscNodeT[] = [];
	let partitionStartIndex = 0;

	function popPartition() {
		if (!partition.length) return;

		if (currentMark)
			output.push(
				<Mark key={output.length} mark={currentMark}>
					<IriscInlineContent
						nodes={partition}
						ctx={ctx}
						markStart={markStart + 1}
						indexOffset={(indexOffset ?? 0) + partitionStartIndex}
					/>
				</Mark>
			);

		partition = [];
	}

	nodes.forEach((node, i) => {
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
			if (!partition.length) partitionStartIndex = i;
			partition.push(node);
		} else {
			output.push(
				<InlineNode key={i} index={i + indexOffset} node={node} ctx={ctx} />
			);
		}
	});

	popPartition();

	return output;
}

export function IriscBlockContent({
	nodes,
	ctx,
	indexOffset = 0
}: {
	nodes: IriscNodeT[];
	ctx?: IriscContext;
	indexOffset?: number;
}) {
	return nodes.map((n, i) => (
		<IriscNode key={i} index={i + indexOffset} node={n} ctx={ctx} />
	));
}

// https://github.com/ProseMirror/prosemirror-tables/blob/master/src/tableview.ts
// Copyright (C) 2015-2016 by Marijn Haverbeke <marijnh@gmail.com> and others (MIT)
const cellMinWidth = 25;
function tableSize(table: IriscNodeT) {
	let totalWidth = 0;
	let fixedWidth = true;
	const widths: (number | null)[] = [];

	if (!table.content?.length) return null;

	const row = table.content[0];
	if (row.type !== 'table_row' || !row.content) return null;

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
	ctx
}: {
	nodes: SummaryNode[];
	ctx?: IriscContext;
}) {
	return (
		<ul className="list-none mt-1 mb-2">
			{nodes.map((node, i) => {
				const contents = (
					<IriscInlineContent nodes={node.title ?? []} ctx={ctx} />
				);

				return (
					<li key={i}>
						<Link to={node.href ?? ''}>{contents}</Link>
						{node.children && <SummaryList nodes={node.children} ctx={ctx} />}
					</li>
				);
			})}
		</ul>
	);
}

export function Summary({
	summary,
	ctx
}: {
	summary: SummaryNode[];
	ctx?: IriscContext;
}) {
	return (
		<div>
			{summary.map((node, i) => (
				<Fragment key={i}>
					{node.title && (
						<span className="text-[1.125em]">
							<IriscInlineContent nodes={node.title} ctx={ctx} />
						</span>
					)}
					{node.children && <SummaryList nodes={node.children} ctx={ctx} />}
				</Fragment>
			))}
		</div>
	);
}

function NoteIcon({ noteType }: { noteType: string }) {
	switch (noteType) {
		case 'info':
			return <Info className="inline w-4 h-4" />;
		case 'warning':
			return <Warning className="inline w-4 h-4" />;
		case 'tip':
			return <Tip className="inline w-4 h-4" />;
		case 'problem':
			return <Problem className="inline w-5 h-5" />;
		case 'exercise':
			return <Exercise className="inline w-5 h-5" />;
	}
}

export function IriscNode({
	node,
	ctx,
	index
}: {
	node: IriscNodeT;
	ctx?: IriscContext;
	index?: number;
}) {
	const props = {
		'data-index': index
	};

	function getBlockContent() {
		return node.content && <IriscBlockContent nodes={node.content} ctx={ctx} />;
	}

	function getInlineContent() {
		return (
			node.content && <IriscInlineContent nodes={node.content} ctx={ctx} />
		);
	}

	switch (node.type) {
		case 'paragraph':
			return <p {...props}>{getInlineContent()}</p>;
		case 'heading': {
			const id = node.html?.id;
			const level = node.attrs?.level;

			const children = (
				<>
					{id && (
						<a onClick={() => goToAnchor(id)} tabIndex={-1}>
							<span className="anchor-link"></span>
						</a>
					)}
					{getInlineContent()}
				</>
			);

			if (level === 2) {
				return (
					<h2 {...props} id={id}>
						{children}
					</h2>
				);
			} else if (level === 3) {
				return (
					<h3 {...props} id={id}>
						{children}
					</h3>
				);
			} else if (level === 4) {
				return (
					<h4 {...props} id={id}>
						{children}
					</h4>
				);
			}

			break;
		}

		case 'horizontal_rule':
			return <hr />;
		case 'code_block': {
			const language = node.attrs?.language;
			if (typeof language !== 'string') return null;

			return (
				// eslint-disable-next-line react-hooks/purity
				<pre {...props} key={Math.random() * 10000}>
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
				<figure {...props} className={domClass} style={domStyle}>
					{getBlockContent()}
				</figure>
			);
		}
		case 'figure_caption': {
			return <figcaption {...props}>{getInlineContent()}</figcaption>;
		}
		case 'image': {
			const src = node.attrs?.src as string | undefined;
			const alt = node.attrs?.alt as string | undefined;
			if (src === undefined || alt === undefined) return null;

			return <Image {...props} src={src} alt={alt} />;
		}

		case 'blockquote': {
			return <blockquote {...props}>{getBlockContent()}</blockquote>;
		}

		case 'note': {
			const noteType = node.attrs?.type as string | undefined;
			if (!node.content || !noteType) return null;

			const label = node.content[0];
			if (!label.content || label.type !== 'note_label') return null;

			return (
				<div {...props} className={`note ${noteType}`}>
					<span
						data-index={0}
						className="note__label flex flex-row gap-2 items-center"
					>
						<NoteIcon noteType={noteType} />
						<IriscInlineContent nodes={label.content} ctx={ctx} />
					</span>
					<IriscBlockContent
						indexOffset={1}
						nodes={node.content.slice(1)}
						ctx={ctx}
					/>
				</div>
			);
		}
		case 'aside': {
			return <aside {...props}>{getBlockContent()}</aside>;
		}

		case 'ordered_list': {
			const order = node.attrs?.order as number | undefined;
			return (
				<ol {...props} start={order}>
					{getBlockContent()}
				</ol>
			);
		}
		case 'bullet_list':
			return <ul {...props}>{getBlockContent()}</ul>;
		case 'list_item':
			return <li {...props}>{getBlockContent()}</li>;

		case 'table': {
			const sizeData = tableSize(node);
			return (
				<div className="max-w-full overflow-auto">
					<table {...props} style={sizeData?.style}>
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
			return <tr {...props}>{getBlockContent()}</tr>;
		case 'table_cell':
			return (
				<td
					{...props}
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
					{...props}
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
			return node.html?.code && <div {...props}>{parse(node.html.code)}</div>;

		case 'summary':
			if (!ctx?.meta?.summary) return null;
			return (
				<>
					<h2 className="mb-2">Contents</h2>
					<Summary summary={ctx.meta.summary} ctx={ctx} />
				</>
			);

		case 'question': {
			const src = node.attrs?.src as string | undefined;
			if (!src) return null;

			return <NetQuestionComponent src={src} />;
		}

		case 'hint_prompt': {
			const id = node.attrs?.id as string | undefined;
			if (!id) return null;

			return <HintPrompt id={id} />;
		}
	}
}

import { ReactNode } from 'react';
import type { IriscNode, IriscMark } from 'patchouli';
import deepEqual from 'deep-equal';
import { Link } from 'react-aria-components';
import { goToAnchor } from '$components/utils';

function InlineNode({ node }: { node: IriscNode }) {
	switch (node.type) {
		case 'text':
			return node.text ?? '';
		case 'nbsp':
			return '\u00A0';
		case 'hard_break':
			return <br />;
	}

	return null;
}

function Mark({ mark, children }: { mark: IriscMark; children: ReactNode }) {
	switch (mark.type) {
		case 'link':
			return <Link href={String(mark.attrs?.href)}>{children}</Link>;

		case 'em':
			return <em>{children}</em>;
		case 'strong':
			return <strong>{children}</strong>;
		case 'u':
			return <u>{children}</u>;
		case 's':
			return <s>{children}</s>;
		case 'sup':
			return <sup>{children}</sup>;
		case 'sub':
			return <sub>{children}</sub>;
		case 'smallcaps':
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
	markStart = 0
}: {
	nodes: IriscNode[];
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
					<IriscInlineContent nodes={partition} markStart={markStart + 1} />
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
			output.push(<InlineNode key={output.length} node={node} />);
		}
	}

	popPartition();

	return output;
}

export function IriscBlockContent({ nodes }: { nodes: IriscNode[] }) {
	return nodes.map((n, i) => <IriscNode node={n} key={i} />);
}

export function IriscNode({ node }: { node: IriscNode }) {
	switch (node.type) {
		case 'doc':
			return node.content && <IriscBlockContent nodes={node.content} />;
		case 'paragraph':
			return (
				<p>{node.content && <IriscInlineContent nodes={node.content} />}</p>
			);
		case 'heading': {
			const id = node.html?.id;
			const level = node.attrs?.level;

			const children = (
				<>
					{id && (
						<Link onPress={() => goToAnchor(id)}>
							<span className="anchor-link"></span>
						</Link>
					)}
					{node.content && <IriscInlineContent nodes={node.content} />}
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
						{node.content && <IriscInlineContent nodes={node.content} />}
					</code>
				</pre>
			);
		}
	}
}

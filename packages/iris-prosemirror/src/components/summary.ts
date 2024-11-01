import type { ProseMirrorComponent } from '../';
import type { NodeSpec, NodeType, Node } from 'prosemirror-model';
import { Selection, type Command } from 'prosemirror-state';
import { bulletList, listItem } from 'prosemirror-schema-list';
import { Plugin } from 'prosemirror-state';

const summaryPlugin = new Plugin({
	filterTransaction(tr, state) {
		if (!tr.docChanged) return true;

		// Disallow creation and removal of summary node
		const { summary } = state.schema.nodes;

		let summaryNode: Node | undefined;

		state.doc.forEach((node) => {
			if (node.type === summary) summaryNode = node;
		});

		let newSummaryNode: Node | undefined;

		tr.doc.forEach((node) => {
			if (node.type === summary) newSummaryNode = node;
		});

		return !!summaryNode === !!newSummaryNode;
	}
});

const toggleSummaryHeading: Command = (state, dispatch) => {
	const { summary, summary_page, summary_heading, summary_list } =
		state.schema.nodes;
	const { $head } = state.selection;

	let targetType: NodeType;
	if ($head.parent.type === summary_heading) {
		targetType = summary_list;
	} else if ($head.parent.type === summary_page) {
		targetType = summary_heading;
	} else {
		return false;
	}

	let targetDepth: number | undefined;

	for (let depth = $head.depth; depth >= 0; depth--) {
		if ($head.node(depth).type === summary) {
			targetDepth = depth + 1;
			break;
		}
	}

	if (!targetDepth) return false;
	const after = $head.after(targetDepth);

	if (state.doc.nodeAt(after)?.type === targetType) {
		if (dispatch) {
			dispatch(state.tr.setSelection(Selection.near(state.doc.resolve(after))));
		}

		return true;
	}

	if (dispatch) {
		const node = targetType.createAndFill();

		if (node) {
			const tr = state.tr.replaceWith(after, after, node).scrollIntoView();

			tr.setSelection(Selection.near(tr.doc.resolve(after)));
			dispatch(tr);
		}
	}

	return true;
};

export const summaryComponent = {
	plugins: [summaryPlugin],
	nodes: {
		summary: {
			content: '(summary_list | summary_heading)+',
			draggable: true,
			toDOM() {
				return ['div', { class: 'summary' }, 0];
			}
		} as NodeSpec,
		summary_heading: {
			content: 'inline*',
			toDOM() {
				return ['span', { class: 'summary-heading' }, 0];
			}
		} as NodeSpec,
		summary_list: {
			...bulletList,
			content: 'summary_list_item+'
		} as NodeSpec,
		summary_list_item: {
			...listItem,
			content: 'summary_page summary_list*'
		} as NodeSpec,
		summary_page: {
			content: 'text*',
			marks: '',
			toDOM() {
				return ['span', { class: 'summary-page' }, 0];
			}
		} as NodeSpec
	},
	commands: {
		toggleSummaryHeading
	}
} satisfies ProseMirrorComponent;

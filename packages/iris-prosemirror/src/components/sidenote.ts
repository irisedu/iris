import type { ProseMirrorComponent } from '../';
import {
	TextSelection,
	type Command,
	type EditorState
} from 'prosemirror-state';
import type { NodeSpec } from 'prosemirror-model';

function getSidenote(state: EditorState) {
	const sidenote = state.schema.nodes.sidenote;
	const { $from } = state.selection;

	for (let i = 0; i <= $from.depth; i++) {
		if ($from.node(i).type === sidenote) return $from.start(i);
	}

	return null;
}

const insertSidenote: Command = (state, dispatch) => {
	const sidenote = state.schema.nodes.sidenote;
	const { anchor } = state.selection;

	if (getSidenote(state)) return false;

	if (dispatch) {
		const node = sidenote.createAndFill({}, state.selection.content().content);

		if (node) {
			const tr = state.tr.replaceSelectionWith(node);

			tr.setSelection(TextSelection.near(tr.doc.resolve(anchor + 2)));
			dispatch(tr);
		}
	}

	return true;
};

function setSidenoteNumbering(numbered: boolean): Command {
	return (state, dispatch) => {
		const sidenotePos = getSidenote(state);
		if (!sidenotePos) return false;

		if (dispatch) {
			dispatch(
				state.tr.setNodeAttribute(sidenotePos - 1, 'numbered', numbered)
			);
		}

		return true;
	};
}

export const sidenoteComponent = {
	nodes: {
		sidenote: {
			content: 'block+',
			attrs: { numbered: { default: false, validate: 'boolean' } },
			inline: true,
			draggable: true,
			toDOM(node) {
				let containerClass = 'sidenote-container';
				if (node.attrs.numbered) containerClass += ' numbered';

				return [
					'div',
					{ class: containerClass },
					['span', { class: 'sidenote' }, 0]
				];
			},
			parseDOM: [{ tag: 'aside' }]
		} as NodeSpec
	},
	commands: {
		getSidenote,
		insertSidenote,
		setSidenoteNumbering
	}
} satisfies ProseMirrorComponent;

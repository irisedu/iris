import type { ProseMirrorComponent } from '../';
import {
	TextSelection,
	type Command,
	type EditorState
} from 'prosemirror-state';
import type { NodeSpec } from 'prosemirror-model';

function getAside(state: EditorState) {
	const { aside } = state.schema.nodes;
	const { $from } = state.selection;

	for (let i = 0; i <= $from.depth; i++) {
		if ($from.node(i).type === aside) return $from.start(i);
	}

	return null;
}

const insertAside: Command = (state, dispatch) => {
	const { aside } = state.schema.nodes;
	const { anchor } = state.selection;

	if (getAside(state)) return false;

	if (dispatch) {
		const node = aside.createAndFill({}, state.selection.content().content);

		if (node) {
			const tr = state.tr.replaceSelectionWith(node);

			tr.setSelection(TextSelection.near(tr.doc.resolve(anchor + 1)));
			dispatch(tr);
		}
	}

	return true;
};

export const asideComponent = {
	nodes: {
		aside: {
			group: 'block',
			content: 'block+',
			draggable: true,
			toDOM() {
				return ['aside', 0];
			},
			parseDOM: [{ tag: 'aside' }]
		} as NodeSpec
	},
	commands: {
		getAside,
		insertAside
	}
} satisfies ProseMirrorComponent;

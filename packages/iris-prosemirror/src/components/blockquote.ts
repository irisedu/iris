import type { ProseMirrorComponent } from '../';
import type { NodeSpec } from 'prosemirror-model';
import { InputRule } from 'prosemirror-inputrules';
import { Selection } from 'prosemirror-state';

export const blockQuoteComponent = {
	nodes: {
		blockquote: {
			group: 'block',
			content: 'block+',
			toDOM() {
				return ['blockquote', 0];
			},
			parseDOM: [{ tag: 'blockquote' }]
		} as NodeSpec
	},
	inputRules: (schema) => [
		new InputRule(/^>\s$/, (state, _, start, end) => {
			const blockquote = schema.nodes.blockquote.createAndFill();
			if (!blockquote) return null;

			const tr = state.tr.replaceRangeWith(start, end, blockquote);
			tr.setSelection(Selection.near(tr.doc.resolve(start + 1)));

			return tr;
		})
	]
} satisfies ProseMirrorComponent;

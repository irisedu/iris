import type { ProseMirrorComponent } from '../';
import type { MarkSpec } from 'prosemirror-model';
import type { Command } from 'prosemirror-state';
import { toggleMark } from 'prosemirror-commands';
import { markActive } from '../utils';

const toggleLink: Command = (state, dispatch) => {
	const link = state.schema.marks.link;
	const { from, to, empty } = state.selection;

	if (!toggleMark(link)(state)) return false;

	if (markActive(state, link)) {
		if (!dispatch) return true;

		// Clear mark from all links in range
		const tr = state.tr;

		state.doc.nodesBetween(from, to, (node, pos) => {
			if (link.isInSet(node.marks)) tr.removeMark(pos, pos + node.nodeSize);
		});

		dispatch(tr);
	} else {
		if (empty) return false;

		// Add link across entire range
		if (dispatch) dispatch(state.tr.addMark(from, to, link.create()));
	}

	return true;
};

export const linkComponent = {
	marks: {
		link: {
			attrs: { href: { default: '', validate: 'string' } },
			inclusive: false,
			excludes: 'underline',
			toDOM(node) {
				return ['a', node.attrs, 0];
			},
			parseDOM: [
				{
					tag: 'a[href]',
					getAttrs(dom) {
						return { href: dom.getAttribute('href') };
					}
				}
			]
		} as MarkSpec
	},
	commands: {
		toggleLink
	}
} satisfies ProseMirrorComponent;

import type { ProseMirrorComponent } from '../';
import type { MarkSpec } from 'prosemirror-model';
import type { Command } from 'prosemirror-state';
import { toggleMark } from 'prosemirror-commands';
import { markActive } from '../utils';
import type { EditorProps } from 'prosemirror-view';

const handlePaste: EditorProps['handlePaste'] = (view, event) => {
	const data = event.clipboardData?.getData('text/plain');
	if (!data) return;

	try {
		new URL(data);

		const { from, to, empty } = view.state.selection;
		const { link } = view.state.schema.marks;

		const mark = link.create({ href: data });

		if (empty) {
			// Insert new link with same text as URL
			view.dispatch(
				view.state.tr.replaceSelectionWith(
					view.state.schema.text(data, [
						link.create({
							href: data
						})
					]),
					false
				)
			);
		} else {
			// Convert selection to link
			view.dispatch(view.state.tr.addMark(from, to, mark));
		}

		return true;
	} catch {
		// Nothing
	}
};

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
		toggleLink,
		handlePaste
	}
} satisfies ProseMirrorComponent;

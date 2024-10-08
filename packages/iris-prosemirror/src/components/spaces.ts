import type { ProseMirrorComponent } from '../';
import type { NodeSpec } from 'prosemirror-model';

export const spacesComponent = {
	nodes: {
		nbsp: {
			group: 'inline',
			inline: true,
			toDOM() {
				return ['span', { class: 'display-nbsp' }, '\u00A0'];
			},
			parseDOM: [{ tag: 'span.display-nbsp' }]
		} as NodeSpec,
		hard_break: {
			group: 'inline',
			inline: true,
			selectable: false,
			toDOM() {
				return ['br'];
			},
			parseDOM: [{ tag: 'br' }]
		} as NodeSpec,
		horizontal_rule: {
			group: 'block',
			toDOM() {
				return ['hr'];
			},
			parseDOM: [{ tag: 'hr' }]
		} as NodeSpec
	}
} satisfies ProseMirrorComponent;

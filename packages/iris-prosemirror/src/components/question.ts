import type { ProseMirrorComponent } from '../';
import type { NodeSpec } from 'prosemirror-model';

export const questionComponent = {
	nodes: {
		question: {
			group: 'block',
			content: 'text*',
			code: true,
			draggable: true,
			marks: '',
			toDOM() {
				return ['div', { class: 'question' }, 0];
			}
		} as NodeSpec
	}
} satisfies ProseMirrorComponent;

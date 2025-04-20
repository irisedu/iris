import type { ProseMirrorComponent } from '../';
import { NodeSpec } from 'prosemirror-model';

export const llmComponent = {
	nodes: {
		hint_prompt: {
			group: 'block',
			attrs: { id: { default: '', validate: 'string' } },
			draggable: true,
			toDOM() {
				return ['div', { class: 'hint-prompt' }, 0];
			}
		} as NodeSpec
	}
} satisfies ProseMirrorComponent;

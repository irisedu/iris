import type { ProseMirrorComponent } from '../../';
import type { NodeSpec } from 'prosemirror-model';
import FrontmatterView from './FrontmatterView';

export const frontmatterComponent = {
	nodes: {
		frontmatter: {
			content: 'title frontmatter_attributes',
			toDOM() {
				return ['div', { class: 'frontmatter' }, 0];
			}
		} as NodeSpec,
		title: {
			content: 'inline*',
			toDOM() {
				return ['h1', { class: 'title' }, 0];
			},
			parseDOM: [{ tag: 'h1' }]
		} as NodeSpec,
		frontmatter_attributes: {
			attrs: { data: { default: null } },
			selectable: false,
			// Should not be necessary. Added due to transition from @nytimes to @handlewithcare/react-prosemirror
			toDOM() {
				return ['div'];
			}
		} as NodeSpec
	},
	reactNodeViews: {
		frontmatter_attributes: FrontmatterView
	}
} satisfies ProseMirrorComponent;

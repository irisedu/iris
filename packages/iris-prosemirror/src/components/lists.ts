import type { ProseMirrorComponent } from '../';
import type { NodeSpec } from 'prosemirror-model';
import { orderedList, bulletList, listItem } from 'prosemirror-schema-list';
import { wrappingInputRule } from 'prosemirror-inputrules';

export const listsComponent = {
	nodes: {
		ordered_list: {
			...orderedList,
			content: 'list_item+',
			group: 'block'
		} as NodeSpec,
		bullet_list: {
			...bulletList,
			content: 'list_item+',
			group: 'block'
		} as NodeSpec,
		list_item: {
			...listItem,
			content: 'paragraph block*'
		} as NodeSpec
	},
	inputRules: (schema) => [
		wrappingInputRule(
			/^(\d+)\.\s$/,
			schema.nodes.ordered_list,
			(match) => ({ order: +match[1] }),
			(match, node) => node.childCount + node.attrs.order == +match[1]
		),
		wrappingInputRule(/^\s*([-+*])\s$/, schema.nodes.bullet_list)
	]
} satisfies ProseMirrorComponent;

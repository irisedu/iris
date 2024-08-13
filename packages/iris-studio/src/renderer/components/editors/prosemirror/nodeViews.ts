import type { NodeViewConstructor } from 'prosemirror-view';
import { CodeBlockView } from './codemirror';

export default {
	code_block: (node, view, getPos) => new CodeBlockView(node, view, getPos)
} as Record<string, NodeViewConstructor>;

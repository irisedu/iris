import type { MarkSpec, NodeSpec, Schema } from 'prosemirror-model';
import type { Plugin } from 'prosemirror-state';
import type { InputRule } from 'prosemirror-inputrules';
import type { NodeViewConstructor } from 'prosemirror-view';
import type { ProseMirror } from '@handlewithcare/react-prosemirror';

export type ReactNodeViewMap = NonNullable<
	Parameters<typeof ProseMirror>[0]['nodeViews']
>;

export interface ProseMirrorComponent {
	plugins?: Plugin[];
	nodes?: Record<string, NodeSpec>;
	marks?: Record<string, MarkSpec>;
	commands?: Record<string, (...args: never) => unknown>;
	nodeViews?: Record<string, NodeViewConstructor>;
	reactNodeViews?: ReactNodeViewMap;

	inputRules?: (schema: Schema) => InputRule[];
}

export * from './configs';
export * from './utils';
export * from './components';
export * from './templates';
export * from './ProseMirrorEditor';
export * from './menu/MenuBar';

import type { MarkSpec, NodeSpec, Schema } from 'prosemirror-model';
import type { Plugin } from 'prosemirror-state';
import type { InputRule } from 'prosemirror-inputrules';
import type { NodeViewConstructor } from 'prosemirror-view';
import type { ReactNodeViewConstructor } from '@nytimes/react-prosemirror';

export interface ProseMirrorComponent {
	plugins?: Plugin[];
	nodes?: Record<string, NodeSpec>;
	marks?: Record<string, MarkSpec>;
	// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
	commands?: Record<string, Function>;
	nodeViews?: Record<string, NodeViewConstructor>;
	reactNodeViews?: Record<string, ReactNodeViewConstructor>;

	inputRules?: (schema: Schema) => InputRule[];
}

export * from './configs';
export * from './utils';
export * from './components';
export * from './templates';

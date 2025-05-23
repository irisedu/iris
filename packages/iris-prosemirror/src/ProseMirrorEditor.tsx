import type { RefObject } from 'react';
import type { EditorState } from 'prosemirror-state';
import {
	ProseMirror,
	type ReactNodeViewConstructor,
	type ProseMirrorProps,
	useNodeViews
} from '@nytimes/react-prosemirror';
import { type NodeViewConstructor } from 'prosemirror-view';
import ClickEditors from './ClickEditors';
import { handlePaste } from 'iris-prosemirror';

import 'prosemirror-view/style/prosemirror.css';

export interface ProseMirrorEditorProps extends ProseMirrorProps {
	mount: HTMLElement | null;
	stateRef: RefObject<EditorState>;
	nodeViews?: Record<string, NodeViewConstructor>;
	reactNodeViews?: Record<string, ReactNodeViewConstructor>;
}

export function ProseMirrorEditor({
	children,
	mount,
	stateRef,
	nodeViews,
	reactNodeViews,
	dispatchTransaction: dt,
	...props
}: ProseMirrorEditorProps) {
	const { nodeViews: rNodeViews, renderNodeViews } = useNodeViews(
		reactNodeViews ?? {}
	);

	return (
		<ProseMirror
			{...props}
			attributes={{
				spellcheck: 'false',
				...props.attributes
			}}
			mount={mount}
			nodeViews={{ ...nodeViews, ...rNodeViews }}
			dispatchTransaction={function (tr) {
				stateRef.current = this.state.apply(tr);
				if (dt) dt.bind(this)(tr);
			}}
			handlePaste={handlePaste}
		>
			<ClickEditors />
			{children}
			{renderNodeViews()}
		</ProseMirror>
	);
}

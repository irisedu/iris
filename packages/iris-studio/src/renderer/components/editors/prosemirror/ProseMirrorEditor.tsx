import type { MutableRefObject } from 'react';
import type { EditorState } from 'prosemirror-state';
import {
	ProseMirror,
	type ReactNodeViewConstructor,
	type ProseMirrorProps,
	useNodeViews
} from '@nytimes/react-prosemirror';
import { type NodeViewConstructor } from 'prosemirror-view';
import FloatingMenu from './FloatingMenu';

export interface ProseMirrorEditorProps extends ProseMirrorProps {
	mount: HTMLElement | null;
	stateRef: MutableRefObject<EditorState>;
	nodeViews?: Record<string, NodeViewConstructor>;
	reactNodeViews?: Record<string, ReactNodeViewConstructor>;
}

function ProseMirrorEditor({
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
		>
			<FloatingMenu />
			{children}
			{renderNodeViews()}
		</ProseMirror>
	);
}

export default ProseMirrorEditor;

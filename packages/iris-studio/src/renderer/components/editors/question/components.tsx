import { useEffect, useRef, useState } from 'react';
import type { IrisNode } from '@irisedu/schemas';
import {
	ProseMirrorEditor,
	baseNodeViews,
	basePlugins,
	baseReactNodeViews,
	baseSchema
} from 'iris-prosemirror';
import { EditorState, type Plugin } from 'prosemirror-state';
import { Node, type Schema } from 'prosemirror-model';
import { type NodeViewConstructor } from 'prosemirror-view';
import {
	type ProseMirrorProps,
	type ReactNodeViewConstructor
} from '@nytimes/react-prosemirror';

export interface ProseMirrorPreset {
	schema: Schema;
	plugins: Plugin[];
	nodeViews: Record<string, NodeViewConstructor>;
	reactNodeViews: Record<string, ReactNodeViewConstructor>;
	defaultState: EditorState;
}

export const baseBlockPreset: ProseMirrorPreset = {
	schema: baseSchema,
	plugins: basePlugins,
	nodeViews: baseNodeViews,
	reactNodeViews: baseReactNodeViews,
	defaultState: EditorState.create({
		plugins: basePlugins,
		schema: baseSchema
	})
};

export interface ProseMirrorFieldProps extends Omit<ProseMirrorProps, 'mount'> {
	preset?: ProseMirrorPreset;
	value: IrisNode[];
	onValueChanged: (newVal: IrisNode[]) => void;
}

export function ProseMirrorField({
	preset,
	value,
	onValueChanged,
	...props
}: ProseMirrorFieldProps) {
	preset ??= baseBlockPreset;

	const [mount, setMount] = useState<HTMLElement | null>(null);
	const [state, setState] = useState(preset.defaultState);
	const stateRef = useRef(state);

	// ??????
	useEffect(() => {
		setState(
			EditorState.create({
				plugins: preset.plugins,
				doc: Node.fromJSON(preset.schema, {
					type: 'doc',
					content: value
				})
			})
		);
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	// Must use a controlled component to avoid extremely bad rerender problems
	return (
		<ProseMirrorEditor
			{...props}
			mount={mount}
			stateRef={stateRef}
			nodeViews={preset.nodeViews}
			reactNodeViews={preset.reactNodeViews}
			state={state}
			dispatchTransaction={function (tr) {
				setState(stateRef.current);
				if (tr.docChanged)
					onValueChanged(stateRef.current.doc.toJSON().content);
			}}
		>
			<div ref={setMount} />
		</ProseMirrorEditor>
	);
}

// https://github.com/adobe/react-spectrum/issues/4674#issuecomment-1970599091
// FIXME
// FIXME
export function useCellEditMode() {
	const isFocusedRef = useRef(false);
	const isEditModeRef = useRef(false);

	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			// ???
			if (e.ctrlKey && ['s', '[', ']'].includes(e.key)) return;

			if (isFocusedRef.current) {
				if (e.code === 'Enter') {
					isEditModeRef.current = true;
				} else if (e.code === 'Escape' || e.code === 'Tab') {
					isEditModeRef.current = false;
				}
				if (isEditModeRef.current) {
					e.stopPropagation();
				}
			}
		};
		// capture all events on 'window' because we are in the capture phase
		window.addEventListener('keydown', handler, true);
		return () => {
			window.removeEventListener('keydown', handler, true);
		};
	}, []);

	const setFocus = (should: boolean) => (isFocusedRef.current = should);

	const preventEvents = {
		focus: () => setFocus(true),
		blur: () => setFocus(false),
		click: () => {
			isEditModeRef.current = true;
		}
	};

	const preventEventsProps = {
		onFocus: () => setFocus(true),
		onBlur: () => setFocus(false),
		onClick: () => {
			isEditModeRef.current = true;
		}
	};

	return { preventEvents, preventEventsProps };
}

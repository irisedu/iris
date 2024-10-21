import { useState, useRef } from 'react';
import { ProseMirror } from '@nytimes/react-prosemirror';
import { EditorState } from 'prosemirror-state';
import { Node } from 'prosemirror-model';
import {
	docSchema,
	docPlugins,
	docNodeViews,
	docReactNodeViews
} from 'iris-prosemirror';
import { useFileEditor } from './editorUtils';
import MenuBar from './prosemirror/menu/MenuBar';
import FloatingMenu from './prosemirror/FloatingMenu';
import { useNodeViews } from '@nytimes/react-prosemirror';

import type { TabData } from '$state/tabsSlice';

import 'prosemirror-view/style/prosemirror.css';
import './prosemirror/styles.css';
import 'iris-prosemirror/styles';

const editorProps = {
	attributes: {
		spellcheck: 'false',
		class:
			'relative outline-none max-w-[70ch] min-h-[1rem] box-content px-8 mr-[20ch] border-l-2 border-r-2 border-iris-300'
	}
};

const stateConfig = {
	plugins: docPlugins
};

const defaultState = EditorState.create({
	...stateConfig,
	schema: docSchema
});

function ProseMirrorEditor({ tabData }: { tabData: TabData }) {
	const [mount, setMount] = useState<HTMLElement | null>(null);

	const { nodeViews: rNodeViews, renderNodeViews } =
		useNodeViews(docReactNodeViews);

	const [defaultEditorState, setDefaultEditorState] =
		useState<EditorState | null>(null);
	const stateRef = useRef(defaultState);

	const { onEditorChange, autosave } = useFileEditor({
		tabData,
		getAutosave() {
			return stateRef.current.toJSON();
		},
		restoreAutosave(state) {
			const prevState = EditorState.fromJSON(
				{ ...stateConfig, schema: docSchema },
				state
			);

			setDefaultEditorState(prevState);
			stateRef.current = prevState;
		},
		getFile() {
			return JSON.stringify(
				{
					version: 1,
					data: stateRef.current.doc.toJSON()
				},
				null,
				'\t'
			);
		},
		restoreFile(contents) {
			const newState = EditorState.create({
				...stateConfig,
				doc: Node.fromJSON(docSchema, JSON.parse(contents).data)
			});

			setDefaultEditorState(newState);
			stateRef.current = newState;
		}
	});

	return (
		defaultEditorState && (
			<div className="flex flex-col h-full">
				<ProseMirror
					{...editorProps}
					mount={mount}
					defaultState={defaultEditorState}
					nodeViews={{
						...rNodeViews,
						...docNodeViews
					}}
					dispatchTransaction={(tr) => {
						if (tr.docChanged) onEditorChange();
						stateRef.current = stateRef.current.apply(tr);
					}}
					handleDOMEvents={{
						focusout: autosave
					}}
				>
					<MenuBar />
					<FloatingMenu />

					<div className="grow w-full overflow-y-scroll bg-iris-100 p-16">
						<div ref={setMount} />
					</div>

					{renderNodeViews()}
				</ProseMirror>
			</div>
		)
	);
}

export default ProseMirrorEditor;

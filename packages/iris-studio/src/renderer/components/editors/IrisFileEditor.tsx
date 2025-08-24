import { useState, useRef } from 'react';
import { EditorState } from 'prosemirror-state';
import { Node } from 'prosemirror-model';
import {
	MenuBar,
	ProseMirrorEditor,
	docSchema,
	docPlugins,
	docNodeViews,
	docReactNodeViews,
	saveFile
} from 'iris-prosemirror';
import { useFileEditor } from './editorUtils';
import { ProseMirrorDoc } from '@handlewithcare/react-prosemirror';

import type { TabData } from '$state/tabsSlice';

const stateConfig = {
	plugins: docPlugins
};

const defaultState = EditorState.create({
	...stateConfig,
	schema: docSchema
});

function IrisFileEditor({ tabData }: { tabData: TabData }) {
	const stateRef = useRef(defaultState);

	const [defaultEditorState, setDefaultEditorState] =
		useState<EditorState | null>(null);

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
			return saveFile(stateRef.current.doc);
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
				<ProseMirrorEditor
					attributes={{
						class:
							'relative outline-hidden max-w-[70ch] min-h-[1rem] box-content px-8 mr-[20ch]'
					}}
					stateRef={stateRef}
					customNodeViews={docNodeViews}
					nodeViews={docReactNodeViews}
					dispatchTransaction={function (tr) {
						if (tr.docChanged) onEditorChange();
					}}
					defaultState={defaultEditorState}
					handleDOMEvents={{
						focusout: autosave
					}}
				>
					<MenuBar />

					<div className="grow w-full overflow-y-scroll bg-iris-100 p-16">
						<ProseMirrorDoc />
					</div>
				</ProseMirrorEditor>
			</div>
		)
	);
}

export default IrisFileEditor;

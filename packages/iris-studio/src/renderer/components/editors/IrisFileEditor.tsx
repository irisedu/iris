import { useState, useRef } from 'react';
import { EditorState } from 'prosemirror-state';
import { Node } from 'prosemirror-model';
import {
	docSchema,
	docPlugins,
	docNodeViews,
	docReactNodeViews,
	saveFile
} from 'iris-prosemirror';
import { useFileEditor } from './editorUtils';
import MenuBar from './prosemirror/menu/MenuBar';

import type { TabData } from '$state/tabsSlice';

import 'prosemirror-view/style/prosemirror.css';
import './prosemirror/styles.css';
import 'iris-prosemirror/styles';
import ProseMirrorEditor from './prosemirror/ProseMirrorEditor';

const stateConfig = {
	plugins: docPlugins
};

const defaultState = EditorState.create({
	...stateConfig,
	schema: docSchema
});

function IrisFileEditor({ tabData }: { tabData: TabData }) {
	const [mount, setMount] = useState<HTMLElement | null>(null);
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
							'relative outline-none max-w-[70ch] min-h-[1rem] box-content px-8 mr-[20ch]'
					}}
					mount={mount}
					stateRef={stateRef}
					nodeViews={docNodeViews}
					reactNodeViews={docReactNodeViews}
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
						<div ref={setMount} />
					</div>
				</ProseMirrorEditor>
			</div>
		)
	);
}

export default IrisFileEditor;

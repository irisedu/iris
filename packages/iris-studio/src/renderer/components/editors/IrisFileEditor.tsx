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
	const [state, setState] = useState(defaultState);
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

			setState(prevState);
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

			setState(newState);
			stateRef.current = newState;
		}
	});

	return (
		<div className="flex flex-col h-full">
			<ProseMirrorEditor
				attributes={{
					class:
						'relative outline-hidden max-w-[70ch] min-h-[1rem] box-content px-8 mr-[20ch]'
				}}
				customNodeViews={docNodeViews}
				nodeViews={docReactNodeViews}
				state={state}
				dispatchTransaction={function (tr) {
					setState((prev) => {
						const newState = prev.apply(tr);
						stateRef.current = newState;
						return newState;
					});
					if (tr.docChanged) onEditorChange();
				}}
				handleDOMEvents={{
					focusout: autosave
				}}
			>
				<MenuBar />

				<div className="grow w-full overflow-y-scroll bg-iris-100 p-16">
					<ProseMirrorDoc spellCheck={false} />
				</div>
			</ProseMirrorEditor>
		</div>
	);
}

export default IrisFileEditor;

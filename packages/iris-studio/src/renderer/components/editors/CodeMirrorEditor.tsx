import { useState, useRef } from 'react';
import CodeMirror, { type ReactCodeMirrorProps } from '@uiw/react-codemirror';
import type { EditorView } from '@codemirror/view';
import type { Extension } from '@codemirror/state';
import { history, historyField } from '@codemirror/commands';
import { color } from '@uiw/codemirror-extensions-color';
import { hyperLink } from '@uiw/codemirror-extensions-hyper-link';
import { githubDark, githubLight } from '@uiw/codemirror-theme-github';
import { LanguageDescription } from '@codemirror/language';
import { languages } from '@codemirror/language-data';
import { useFileEditor } from './editorUtils';

import { useSelector } from 'react-redux';
import { type RootState } from '$state/store';
import type { TabData } from '$state/tabsSlice';

const stateFields = {
	history: historyField
};

async function getLanguageExtension(path: string) {
	const ext = LanguageDescription.matchFilename(languages, path);
	if (ext) return await ext.load();
}

function CodeMirrorEditor({ tabData }: { tabData: TabData }) {
	const dark = useSelector((store: RootState) => store.app.darkTheme);

	const editor = useRef<EditorView | null>(null);

	// Initial CM state
	const [initialValue, setInitialValue] = useState<string>();
	const [initialState, setInitialState] =
		useState<ReactCodeMirrorProps['initialState']>();
	const [extensions, setExtensions] = useState<Extension[]>();

	const { onEditorChange, autosave } = useFileEditor({
		tabData,
		getAutosave() {
			return editor.current ? editor.current.state.toJSON(stateFields) : null;
		},
		restoreAutosave(state) {
			setInitialState({ json: state, fields: stateFields });
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			setInitialValue((state as any).doc);
		},
		getFile() {
			return editor.current?.state.doc.toString() ?? null;
		},
		restoreFile: setInitialValue,
		doInit() {
			getLanguageExtension(tabData.path).then((ext) => {
				const exts = [color, hyperLink, history()];
				if (ext) exts.push(ext);

				setExtensions(exts);
			});
		}
	});

	return (
		<CodeMirror
			height="100%"
			style={{ height: '100%' }}
			extensions={extensions}
			theme={dark ? githubDark : githubLight}
			value={initialValue}
			initialState={initialState}
			onCreateEditor={(view) => {
				editor.current = view;
				view.focus();
			}}
			onChange={onEditorChange}
			onUpdate={(viewUpdate) => {
				if (viewUpdate.focusChanged && !viewUpdate.view.hasFocus) autosave();
			}}
		/>
	);
}

export default CodeMirrorEditor;

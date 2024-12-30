import { useState, useRef } from 'react';
import { useFileEditor } from './editorUtils';
import QuestionMetadataEditor from './question/QuestionMetadataEditor';
import QuestionEditor from './question/QuestionEditor';
import type {
	Question,
	QuestionMetadata,
	QuestionNode
} from '@irisedu/schemas';

import type { TabData } from '$state/tabsSlice';

function QuestionFileEditor({ tabData }: { tabData: TabData }) {
	const [meta, setMeta] = useState<QuestionMetadata>({});
	const [nodes, setNodes] = useState<QuestionNode[]>([]);

	const stateRef = useRef<Question>();

	const { onEditorChange, autosave } = useFileEditor({
		tabData,
		getAutosave() {
			return stateRef.current ?? null;
		},
		restoreAutosave(state) {
			setMeta(state.meta);
			setNodes(state.data);
		},
		getFile() {
			return JSON.stringify(
				{
					version: 1,
					data: {
						meta,
						data: nodes
					} satisfies Question
				},
				null,
				'\t'
			);
		},
		restoreFile(contents) {
			const q = JSON.parse(contents);
			setMeta(q.data.meta);
			setNodes(q.data.data);
		}
	});

	return (
		<div className="h-full overflow-y-auto">
			<div
				className="p-8 mx-auto my-4 max-w-[65ch] bg-iris-100 rounded-md"
				onBlur={autosave}
			>
				<h1 className="mt-0">Interactive Question</h1>

				<h2>Metadata</h2>

				<QuestionMetadataEditor
					value={meta}
					onValueChanged={(update) => {
						onEditorChange();

						const newVal = typeof update === 'function' ? update(meta) : update;
						setMeta(newVal);
						stateRef.current = { meta: newVal, data: nodes };
					}}
				/>

				<h2>Question</h2>

				<QuestionEditor
					value={nodes}
					onValueChanged={(update) => {
						onEditorChange();

						const newVal =
							typeof update === 'function' ? update(nodes) : update;
						setNodes(newVal);
						stateRef.current = { meta, data: newVal };
					}}
				/>
			</div>
		</div>
	);
}

export default QuestionFileEditor;

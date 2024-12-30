import type { IrisQuestionNode } from '@irisedu/schemas';
import { ProseMirrorField } from './components';

export interface IrisQuestionNodeEditorProps {
	node: IrisQuestionNode;
	onUpdate: (newVal: IrisQuestionNode) => void;
}

function IrisQuestionNodeEditor({
	node,
	onUpdate
}: IrisQuestionNodeEditorProps) {
	return (
		<ProseMirrorField
			attributes={{ class: 'p-1 border-2 border-iris-200' }}
			value={node.data}
			onValueChanged={(newVal) => onUpdate({ ...node, data: newVal })}
		/>
	);
}

export default IrisQuestionNodeEditor;

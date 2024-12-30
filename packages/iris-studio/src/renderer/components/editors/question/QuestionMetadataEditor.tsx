import type { QuestionMetadata } from '@irisedu/schemas';
import { Label, TextField, TextArea } from 'iris-components';

export interface QuestionMetadataEditorProps {
	value: QuestionMetadata;
	onValueChanged: (
		update: QuestionMetadata | ((oldVal: QuestionMetadata) => QuestionMetadata)
	) => void;
}

function QuestionMetadataEditor({
	value,
	onValueChanged
}: QuestionMetadataEditorProps) {
	return (
		<div>
			<TextField
				value={value.comment ?? ''}
				onChange={(newVal) =>
					onValueChanged((oldVal) => ({ ...oldVal, comment: newVal }))
				}
			>
				<Label>Comment</Label>
				<TextArea
					className="react-aria-TextArea font-mono"
					spellCheck={false}
				/>
			</TextField>
		</div>
	);
}

export default QuestionMetadataEditor;

import { ProseMirror } from '@handlewithcare/react-prosemirror';
import ClickEditors from './ClickEditors';
import { handlePaste } from 'iris-prosemirror';

import 'prosemirror-view/style/prosemirror.css';

export type ProseMirrorEditorProps = Parameters<typeof ProseMirror>[0];

export function ProseMirrorEditor({
	children,
	...props
}: ProseMirrorEditorProps) {
	return (
		<ProseMirror {...props} handlePaste={handlePaste}>
			<ClickEditors />
			{children}
		</ProseMirror>
	);
}

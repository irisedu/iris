import { useCallback, type RefObject } from 'react';
import type { EditorState, Transaction } from 'prosemirror-state';
import { ProseMirror } from '@handlewithcare/react-prosemirror';
import type { EditorView } from 'prosemirror-view';
import ClickEditors from './ClickEditors';
import { handlePaste } from 'iris-prosemirror';

import 'prosemirror-view/style/prosemirror.css';

export type ProseMirrorEditorProps = Parameters<typeof ProseMirror>[0] & {
	stateRef: RefObject<EditorState>;
};

export function ProseMirrorEditor({
	children,
	stateRef,
	dispatchTransaction: dt,
	...props
}: ProseMirrorEditorProps) {
	const dispatchTransaction = useCallback(
		// eslint-disable-next-line react-hooks/unsupported-syntax
		function (this: EditorView, tr: Transaction) {
			stateRef.current = this.state.apply(tr);
			if (dt) dt.bind(this)(tr);
		},
		[dt, stateRef]
	);

	return (
		<ProseMirror
			{...props}
			attributes={{
				spellcheck: 'false',
				...props.attributes
			}}
			dispatchTransaction={dispatchTransaction}
			handlePaste={handlePaste}
		>
			<ClickEditors />
			{children}
		</ProseMirror>
	);
}

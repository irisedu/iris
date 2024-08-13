import type { MutableRefObject } from 'react';
import { Button, Modal, Dialog, Heading } from 'react-aria-components';

interface DeleteDialogProps {
	isOpen: boolean;
	setIsOpen: (val: boolean) => void;
	targetFiles: string[];
	callbackRef: MutableRefObject<(() => void) | null>;
}

function DeleteDialog({
	isOpen,
	setIsOpen,
	targetFiles,
	callbackRef
}: DeleteDialogProps) {
	return (
		<Modal isDismissable isOpen={isOpen} onOpenChange={setIsOpen}>
			<Dialog>
				<Heading slot="title">Really delete?</Heading>

				<p>
					{targetFiles.length > 1 ? (
						`${targetFiles.length} files/folders`
					) : (
						<span className="font-mono">{targetFiles[0]}</span>
					)}{' '}
					will be deleted permanently.
				</p>

				<div className="flex flex-row gap-2">
					<Button
						className="react-aria-Button border-iris-300"
						onPress={() => setIsOpen(false)}
					>
						Cancel
					</Button>
					<Button
						className="react-aria-Button border-red-500 bg-red-600 text-white dark:border-red-400 dark:bg-red-200 dark:text-black"
						autoFocus
						onPress={() => {
							if (callbackRef.current) callbackRef.current();
							setIsOpen(false);
						}}
					>
						Delete
					</Button>
				</div>
			</Dialog>
		</Modal>
	);
}

export default DeleteDialog;

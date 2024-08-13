import type { MutableRefObject } from 'react';
import { Button, Modal, Dialog, Heading } from 'react-aria-components';

interface CloseDialogProps {
	isOpen: boolean;
	setIsOpen: (val: boolean) => void;
	callbackRef: MutableRefObject<(() => void) | null>;
}

function CloseDialog({ isOpen, setIsOpen, callbackRef }: CloseDialogProps) {
	return (
		<Modal isDismissable isOpen={isOpen} onOpenChange={setIsOpen}>
			<Dialog>
				<Heading slot="title">Unsaved changes</Heading>

				<p>This tab has unsaved changes. Close anyway?</p>

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
						Confirm
					</Button>
				</div>
			</Dialog>
		</Modal>
	);
}

export default CloseDialog;

import type { RefObject } from 'react';
import { Button, Modal, Dialog, Heading } from 'iris-components';

interface CloseDialogProps {
	isOpen: boolean;
	setIsOpen: (val: boolean) => void;
	callbackRef: RefObject<(() => void) | null>;
}

function CloseDialog({ isOpen, setIsOpen, callbackRef }: CloseDialogProps) {
	return (
		<Modal isDismissable isOpen={isOpen} onOpenChange={setIsOpen}>
			<Dialog>
				<Heading slot="title">Unsaved changes</Heading>

				<p>This tab has unsaved changes. Close anyway?</p>

				<div className="flex flex-row gap-2">
					<Button
						className="react-aria-Button button-alt"
						onPress={() => setIsOpen(false)}
					>
						Cancel
					</Button>
					<Button
						className="react-aria-Button button-alert"
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

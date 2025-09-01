import type { RefObject, ReactNode } from 'react';
import { Button, Modal, Dialog, Heading } from 'iris-components';

export interface DeleteDialogProps {
	children: ReactNode;
	isOpen: boolean;
	setIsOpen: (val: boolean) => void;
	callbackRef: RefObject<(() => void) | null>;
}

export function DeleteDialog({
	children,
	isOpen,
	setIsOpen,
	callbackRef
}: DeleteDialogProps) {
	return (
		<Modal isDismissable isOpen={isOpen} onOpenChange={setIsOpen}>
			<Dialog>
				<Heading slot="title">Really delete?</Heading>

				<p>{children}</p>

				<div className="flex flex-row gap-2">
					<Button
						className="react-aria-Button border-iris-300"
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
						Delete
					</Button>
				</div>
			</Dialog>
		</Modal>
	);
}

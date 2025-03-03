import { languages } from '@codemirror/language-data';
import {
	Button,
	Modal,
	Dialog,
	Heading,
	ListBoxItem,
	Dropdown
} from 'iris-components';
import { useMemo } from 'react';

interface CodeLanguageDialogProps {
	isOpen: boolean;
	setIsOpen: (open: boolean) => void;
	language: string;
	setLanguage: (lang: string) => void;
	onPress: () => void;
}

function CodeLanguageDialog({
	isOpen,
	setIsOpen,
	language,
	setLanguage,
	onPress
}: CodeLanguageDialogProps) {
	// This is slow to render, so memoize it.
	const languageItems = useMemo(
		() =>
			languages.map((lang) => (
				<ListBoxItem
					key={lang.name}
					id={lang.alias.length ? lang.alias[0] : lang.name}
					textValue={lang.name}
				>
					{lang.name}
					{lang.alias.length && !lang.alias[0].includes(' ') && (
						<>
							{' '}
							(<span className="font-mono">{lang.alias[0]}</span>)
						</>
					)}
				</ListBoxItem>
			)),
		[]
	);

	return (
		<Modal isDismissable isOpen={isOpen} onOpenChange={setIsOpen}>
			<Dialog>
				<Heading slot="title">Insert code block</Heading>
				<Dropdown
					label="Language"
					selectedKey={language}
					onSelectionChange={(key) => setLanguage(key as string)}
				>
					<ListBoxItem id="">Plain text</ListBoxItem>
					{languageItems}
				</Dropdown>
				<Button
					className="react-aria-Button border-iris-300"
					autoFocus
					onPress={() => {
						onPress();
						setIsOpen(false);
					}}
				>
					Create
				</Button>
			</Dialog>
		</Modal>
	);
}

export default CodeLanguageDialog;

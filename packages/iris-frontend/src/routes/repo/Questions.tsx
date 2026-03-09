import { useState } from 'react';
import {
	Button,
	Checkbox,
	CheckboxGroup,
	Dialog,
	Heading,
	Input,
	Label,
	Modal,
	TextField
} from 'iris-components';
import QuestionList, {
	type QuestionListParams
} from './components/QuestionList';
import { fetchCsrf } from '../../utils';

export default function Questions({
	currentWorkspace,
	workspaces
}: {
	currentWorkspace: string;
	workspaces: QuestionListParams['workspaces'];
}) {
	const [isCreateOpen, setCreateIsOpen] = useState(false);
	const currentWorkspaceTags =
		workspaces.find((w) => w.id === currentWorkspace)?.tags ?? [];
	const [createTags, setCreateTags] = useState<string[]>([]);
	const [createComment, setCreateComment] = useState('');

	const [questionsInvalidate, setQuestionsInvalidate] = useState(0);

	function createQuestion(
		workspace: string,
		tags: string[],
		comment: string,
		type: string
	) {
		fetchCsrf(`/api/repo/workspaces/${workspace}/questions/new`, {
			body: JSON.stringify({ tags, comment, type }),
			headers: {
				'Content-Type': 'application/json'
			}
		}).then(() => {
			setQuestionsInvalidate((n) => n + 1);
		});
	}

	function clearCreate() {
		setCreateTags([]);
		setCreateComment('');
	}

	return (
		<>
			<Modal
				isDismissable
				isOpen={isCreateOpen}
				onOpenChange={setCreateIsOpen}
				className="react-aria-Modal w-[70ch]"
			>
				<Dialog>
					<Heading slot="title">Create question</Heading>

					<CheckboxGroup value={createTags} onChange={setCreateTags}>
						<Label>Tags</Label>
						<div className="flex flex-wrap gap-x-4 text-sm">
							{currentWorkspaceTags.map((t) => (
								<Checkbox
									className="react-aria-Checkbox small"
									key={t.id}
									value={t.id}
								>
									{t.name}
								</Checkbox>
							))}
						</div>
					</CheckboxGroup>

					<TextField value={createComment} onChange={setCreateComment}>
						<Label>Comment</Label>
						<Input className="react-aria-Input max-w-full" />
					</TextField>

					<div className="flex gap-2 mt-3">
						<Button
							onPress={() => {
								setCreateIsOpen(false);
							}}
						>
							Cancel
						</Button>

						<Button
							autoFocus
							onPress={() => {
								if (!currentWorkspace.length) return;

								createQuestion(
									currentWorkspace,
									createTags,
									createComment,
									'latex'
								);
								setCreateIsOpen(false);
							}}
						>
							Create
						</Button>
					</div>
				</Dialog>
			</Modal>

			<div className="flex flex-wrap gap-2 my-4">
				<Button
					onPress={() => {
						clearCreate();
						setCreateIsOpen(true);
					}}
				>
					Create Question
				</Button>
			</div>

			<QuestionList
				currentWorkspace={currentWorkspace}
				workspaces={workspaces}
				questionsInvalidate={questionsInvalidate}
				setQuestionsInvalidate={setQuestionsInvalidate}
			/>
		</>
	);
}

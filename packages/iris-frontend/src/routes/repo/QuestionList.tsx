import { useEffect, useRef, useState } from 'react';
import {
	Button,
	Checkbox,
	CheckboxGroup,
	Dialog,
	Dropdown,
	Heading,
	Input,
	Label,
	ListBoxItem,
	Modal,
	Switch,
	Tag,
	TagGroup,
	TagList,
	TextField
} from 'iris-components';
import { fetchCsrf } from '../../utils';
import { Link } from 'react-router-dom';

import { QuestionPreviewDialog } from './QuestionPreview';

export interface QuestionListParams {
	workspaces: {
		id: string;
		name: string;
		tags: { id: string; name: string }[];
	}[];
}

export default function QuestionList({ workspaces }: QuestionListParams) {
	const [workspace, setWorkspaceInternal] = useState('');
	const [recycleFilter, setRecycleFilter] = useState(false);
	const [tagFilter, setTagFilter] = useState<string[]>([]);
	const tags = workspace.length
		? (workspaces.find((w) => w.id === workspace)?.tags ?? [])
		: [];

	const [isCreateOpen, setCreateIsOpen] = useState(false);
	const [createWorkspace, setCreateWorkspace] = useState('');
	const createWorkspaceTags = createWorkspace.length
		? (workspaces.find((w) => w.id === createWorkspace)?.tags ?? [])
		: [];
	const [createTags, setCreateTags] = useState<string[]>([]);
	const [createComment, setCreateComment] = useState('');

	const [questionsInvalidate, setQuestionsInvalidate] = useState(0);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const [questions, setQuestions] = useState<any[]>([]);

	if (!workspace.length && questions.length) {
		setQuestions([]);
	}

	useEffect(() => {
		if (!workspace.length) {
			return;
		}

		const params = new URLSearchParams();
		if (recycleFilter) {
			params.set('recycle', '1');
		}
		tagFilter.forEach((t) => params.append('tags', t));
		fetch(`/api/repo/workspaces/${workspace}/questions?${params}`)
			.then((res) => res.json())
			.then(setQuestions);
	}, [questionsInvalidate, workspace, recycleFilter, tagFilter]);

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

	function recycleQuestion(workspace: string, qid: string, recycle: boolean) {
		let route = `/api/repo/workspaces/${workspace}/questions/${qid}/recycle`;
		if (recycle) route += '?recycle=1';

		fetchCsrf(route).then(() => {
			setQuestionsInvalidate((n) => n + 1);
		});
	}

	function setWorkspace(newWorkspace: string) {
		setWorkspaceInternal(newWorkspace);
		setTagFilter([]);
	}

	function clearCreate() {
		setCreateTags([]);
		setCreateComment('');
	}

	const [showPreview, setShowPreview] = useState(false);
	const previewHover = useRef<HTMLDivElement>(null);
	const [previewQuestion, setPreviewQuestion] = useState('');
	const [previewFailed, setPreviewFailed] = useState(false);

	const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const [previewDialogQuestion, setPreviewDialogQuestion] = useState<any>(null);

	return (
		<div>
			<QuestionPreviewDialog
				wid={workspace}
				question={previewDialogQuestion}
				isOpen={previewDialogOpen}
				setIsOpen={setPreviewDialogOpen}
			/>

			<div
				ref={previewHover}
				className={`${showPreview ? 'fixed' : 'hidden'} bg-[white] border-[1px] border-[black] top-[1em] bottom-[1em] right-[1em] z-100 min-w-128`}
			>
				{previewQuestion.length &&
					(previewFailed ? (
						<p className="mx-2 my-0 text-lg text-[black]">
							Compilation failed. Please see full preview for details.
						</p>
					) : (
						<img
							src={`/api/repo/workspaces/${workspace}/questions/${previewQuestion}/revs/latest/preview/svg`}
							onLoad={() => setPreviewFailed(false)}
							onError={() => setPreviewFailed(true)}
							alt="Question preview"
							className="h-full"
						/>
					))}
			</div>

			<Modal
				isDismissable
				isOpen={isCreateOpen}
				onOpenChange={setCreateIsOpen}
				className="react-aria-Modal w-[70ch]"
			>
				<Dialog>
					<Heading slot="title">Create question</Heading>

					<Dropdown
						label="Workspace"
						value={createWorkspace}
						onChange={(key) => setCreateWorkspace(key as string)}
					>
						{workspaces?.map((w) => (
							<ListBoxItem key={w.id} id={w.id}>
								{w.name}
							</ListBoxItem>
						))}
					</Dropdown>

					<CheckboxGroup value={createTags} onChange={setCreateTags}>
						<Label>Tags</Label>
						<div className="flex flex-wrap gap-x-4 text-sm">
							{createWorkspaceTags.map((t) => (
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
								if (!createWorkspace.length) return;

								createQuestion(
									createWorkspace,
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

			<div className="flex flex-wrap gap-6">
				<div className="basis-[18%]">
					<h2 className="m-0!">Filter</h2>

					<Dropdown
						label="Workspace"
						value={workspace}
						onChange={(key) => setWorkspace(key as string)}
					>
						{workspaces?.map((w) => (
							<ListBoxItem key={w.id} id={w.id}>
								{w.name}
							</ListBoxItem>
						))}
					</Dropdown>

					<Switch isSelected={recycleFilter} onChange={setRecycleFilter}>
						View recycle bin
					</Switch>

					<CheckboxGroup value={tagFilter} onChange={setTagFilter}>
						<Label>Tags</Label>
						<div className="flex flex-wrap gap-x-4 text-sm">
							{tags.map((t) => (
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
				</div>

				<div className="basis-[78%]">
					<h2 className="m-0!">Questions</h2>

					<table className="w-full hyphens-none">
						<thead>
							<tr>
								<th className="text-left w-[4ch]">ID</th>
								<th className="text-left w-[6ch]">Type</th>
								<th className="text-left">Tags</th>
								<th className="text-left">Creator</th>
								<th className="text-left">Comment</th>
								<th className="text-left">Operation</th>
							</tr>
						</thead>
						<tbody>
							{questions.map((q) => (
								<tr key={q.id}>
									<td
										onMouseEnter={() => {
											setPreviewQuestion(q.id);
											setShowPreview(true);
										}}
										onMouseLeave={() => {
											if (previewQuestion === q.id) setShowPreview(false);
										}}
									>
										{q.num}
									</td>
									<td>{q.type}</td>
									<td>
										<TagGroup selectionMode="none" aria-label="Tags">
											<TagList>
												{q.tags.map((t: { id: string; name: string }) => (
													<Tag key={t.id}>{t.name}</Tag>
												))}
											</TagList>
										</TagGroup>
									</td>
									<td>{q.creator.name}</td>
									<td>{q.comment}</td>
									<td className="flex flex-wrap gap-1">
										<Button
											className="react-aria-Button p-0 px-1"
											onPress={() => {
												setPreviewDialogQuestion(q);
												setPreviewDialogOpen(true);
											}}
										>
											Preview
										</Button>
										<Link
											className="react-aria-Button p-0 px-1"
											to={`/repo/workspaces/${workspace}/questions/${q.id}`}
										>
											Edit
										</Link>
										<Button className="react-aria-Button p-0 px-1">
											Download
										</Button>
										<Button
											className="react-aria-Button p-0 px-1"
											onPress={() =>
												recycleQuestion(workspace, q.id, !recycleFilter)
											}
										>
											{recycleFilter ? 'Restore' : 'Delete'}
										</Button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}

import {
	type SetStateAction,
	useEffect,
	useRef,
	useState,
	type Dispatch
} from 'react';
import {
	Button,
	Checkbox,
	CheckboxGroup,
	Dropdown,
	Label,
	ListBoxItem,
	Switch,
	Tag,
	TagGroup,
	TagList
} from 'iris-components';
import { fetchCsrf } from '../../../utils';
import { Link } from 'react-router-dom';

import { QuestionPreviewDialog } from './QuestionPreview';

export interface QuestionListParams {
	currentWorkspace?: string;
	workspaces: {
		id: string;
		name: string;
		tags: { id: string; name: string }[];
	}[];
	questionsInvalidate: number;
	setQuestionsInvalidate: Dispatch<SetStateAction<number>>;
}

export default function QuestionList({
	currentWorkspace,
	workspaces,
	questionsInvalidate,
	setQuestionsInvalidate
}: QuestionListParams) {
	const [workspace, setWorkspace] = useState('');
	const [recycleFilter, setRecycleFilter] = useState(false);
	const [tagFilter, setTagFilter] = useState<string[]>([]);

	const actualWorkspace = currentWorkspace ?? workspace;

	const tags = actualWorkspace.length
		? (workspaces.find((w) => w.id === actualWorkspace)?.tags ?? [])
		: [];

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const [questions, setQuestions] = useState<any[]>([]);

	if (!actualWorkspace.length && questions.length) {
		setQuestions([]);
	}

	if (!tagFilter.every((t) => tags.some((tag) => tag.id === t))) {
		setTagFilter((curr) =>
			curr.filter((tagId) => tags.some((tagData) => tagData.id === tagId))
		);
	}

	useEffect(() => {
		if (!actualWorkspace.length) {
			return;
		}

		const params = new URLSearchParams();
		if (recycleFilter) {
			params.set('recycle', '1');
		}
		tagFilter.forEach((t) => params.append('tags', t));
		fetch(`/api/repo/workspaces/${actualWorkspace}/questions?${params}`)
			.then((res) => res.json())
			.then(setQuestions);
	}, [questionsInvalidate, actualWorkspace, recycleFilter, tagFilter]);

	function recycleQuestion(workspace: string, qid: string, recycle: boolean) {
		let route = `/api/repo/workspaces/${workspace}/questions/${qid}/recycle`;
		if (recycle) route += '?recycle=1';

		fetchCsrf(route).then(() => {
			setQuestionsInvalidate((n) => n + 1);
		});
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
				wid={actualWorkspace}
				question={previewDialogQuestion}
				isOpen={previewDialogOpen}
				setIsOpen={setPreviewDialogOpen}
			/>

			<div
				ref={previewHover}
				className={`${showPreview ? 'fixed' : 'hidden'} bg-[white] border-[1px] border-[black] top-[1em] bottom-[1em] right-[1em] z-100 min-w-128`}
			>
				{previewQuestion.length && (
					<>
						<img
							src={`/api/repo/workspaces/${actualWorkspace}/questions/${previewQuestion}/revs/latest/preview/svg`}
							onLoad={() => setPreviewFailed(false)}
							onError={() => setPreviewFailed(true)}
							alt="Question preview"
							className={previewFailed ? 'hidden' : 'h-full'}
						/>
						{previewFailed && (
							<p className="mx-2 my-0 text-lg text-[black]">
								Compilation failed. Please see full preview for details.
							</p>
						)}
					</>
				)}
			</div>

			<div className="flex flex-wrap gap-6">
				<div className="basis-[18%]">
					<h2 className="m-0!">Filter</h2>

					{!currentWorkspace && (
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
					)}

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
											to={`/repo/workspaces/${actualWorkspace}/questions/${q.id}`}
										>
											Edit
										</Link>
										<a
											className="react-aria-Button p-0 px-1"
											href={`/api/repo/workspaces/${actualWorkspace}/questions/${q.id}/revs/latest/download`}
										>
											Download
										</a>
										<Button
											className="react-aria-Button p-0 px-1"
											onPress={() =>
												recycleQuestion(actualWorkspace, q.id, !recycleFilter)
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

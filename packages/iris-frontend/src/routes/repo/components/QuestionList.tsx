import {
	type ReactNode,
	type SetStateAction,
	useEffect,
	useRef,
	useState,
	type Dispatch,
	useCallback,
	memo
} from 'react';
import {
	Autocomplete,
	Button,
	Dropdown,
	Input,
	Label,
	ListBoxItem,
	SearchField,
	Switch,
	Tag,
	TagGroup,
	TagList,
	useFilter,
	type Selection
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

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	getActions?: (q: any) => ReactNode;
}

const QuestionTable = memo(function QuestionTable({
	wid,
	questions,
	showPreviewHover,
	showPreviewDialog,
	getActions,
	setQuestionsInvalidate
}: {
	wid: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	questions: any[];
	showPreviewHover: (qid: string, vis: boolean) => void;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	showPreviewDialog: (q: any) => void;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	getActions?: (q: any) => ReactNode;
	setQuestionsInvalidate: Dispatch<SetStateAction<number>>;
}) {
	function recycleQuestion(workspace: string, qid: string, recycle: boolean) {
		let route = `/api/repo/workspaces/${workspace}/questions/${qid}/recycle`;
		if (recycle) route += '?recycle=1';

		fetchCsrf(route).then(() => {
			setQuestionsInvalidate((n) => n + 1);
		});
	}

	return (
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
								showPreviewHover(q.id, true);
							}}
							onMouseLeave={() => {
								showPreviewHover(q.id, false);
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
							{getActions?.(q)}
							<Button
								className="react-aria-Button p-0 px-1"
								onPress={() => {
									showPreviewDialog(q);
								}}
							>
								Preview
							</Button>
							<Link
								className="react-aria-Button p-0 px-1"
								to={`/repo/workspaces/${wid}/questions/${q.id}`}
							>
								Edit
							</Link>
							<a
								className="react-aria-Button p-0 px-1"
								href={`/api/repo/workspaces/${wid}/questions/${q.id}/revs/latest/download`}
							>
								Download
							</a>
							<Button
								className="react-aria-Button p-0 px-1"
								onPress={() => recycleQuestion(wid, q.id, !q.deleted)}
							>
								{q.deleted ? 'Restore' : 'Delete'}
							</Button>
						</td>
					</tr>
				))}
			</tbody>
		</table>
	);
});

export default function QuestionList({
	currentWorkspace,
	workspaces,
	questionsInvalidate,
	setQuestionsInvalidate,
	getActions
}: QuestionListParams) {
	const [workspace, setWorkspace] = useState('');
	const [recycleFilter, setRecycleFilter] = useState(false);
	const [tagFilter, setTagFilter] = useState<Selection>(new Set());

	const actualWorkspace = currentWorkspace ?? workspace;

	const tags = actualWorkspace.length
		? (workspaces.find((w) => w.id === actualWorkspace)?.tags ?? [])
		: [];

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const [questions, setQuestions] = useState<any[]>([]);

	if (!actualWorkspace.length && questions.length) {
		setQuestions([]);
	}

	if (![...tagFilter].every((t) => tags.some((tag) => tag.id === t))) {
		setTagFilter(
			(curr) =>
				new Set(
					[...curr].filter((tagId) =>
						tags.some((tagData) => tagData.id === tagId)
					)
				)
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
		[...tagFilter].forEach((t) => params.append('tags', t as string));
		fetch(`/api/repo/workspaces/${actualWorkspace}/questions?${params}`)
			.then((res) => res.json())
			.then(setQuestions);
	}, [questionsInvalidate, actualWorkspace, recycleFilter, tagFilter]);

	const [hoverPreviewState, setHoverPreviewState] = useState<{
		qid: string;
		vis: boolean;
	}>({ qid: '', vis: false });
	const previewHover = useRef<HTMLDivElement>(null);
	const [previewFailed, setPreviewFailed] = useState(false);

	const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const [previewDialogQuestion, setPreviewDialogQuestion] = useState<any>(null);

	const showPreviewHover = useCallback((qid: string, vis: boolean) => {
		if (vis) {
			setHoverPreviewState({ qid, vis });
		} else {
			setHoverPreviewState((prev) =>
				prev.qid === qid
					? {
							qid,
							vis: false
						}
					: prev
			);
		}
	}, []);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const showPreviewDialog = useCallback((question: any) => {
		setPreviewDialogQuestion(question);
		setPreviewDialogOpen(true);
	}, []);

	const { contains } = useFilter({ sensitivity: 'base' });

	return (
		<div>
			{previewDialogQuestion && (
				<QuestionPreviewDialog
					wid={actualWorkspace}
					qid={previewDialogQuestion.id}
					num={previewDialogQuestion.num}
					isOpen={previewDialogOpen}
					setIsOpen={setPreviewDialogOpen}
				/>
			)}

			<div
				ref={previewHover}
				className={`${hoverPreviewState.vis ? 'fixed' : 'hidden'} bg-[white] border-[1px] border-[black] top-[1em] bottom-[1em] right-[1em] z-100`}
			>
				{hoverPreviewState.qid.length && (
					<>
						<img
							src={`/api/repo/workspaces/${actualWorkspace}/questions/${hoverPreviewState.qid}/revs/latest/preview/svg`}
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
				<div className="basis-[18%] grow">
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

					<Autocomplete filter={contains}>
						<SearchField className="react-aria-SearchField mb-2 flex flex-col gap-1">
							<Label>Tags</Label>
							<Input placeholder="Filter tags" />
						</SearchField>
						<TagGroup
							selectionMode="multiple"
							selectedKeys={tagFilter}
							onSelectionChange={setTagFilter}
						>
							<TagList>
								{tags.map((t) => (
									<Tag key={t.id} id={t.id}>
										{t.name}
									</Tag>
								))}
							</TagList>
						</TagGroup>
					</Autocomplete>
				</div>

				<div className="basis-[78%] grow">
					<h2 className="m-0!">Questions</h2>
					<QuestionTable
						wid={actualWorkspace}
						questions={questions}
						showPreviewHover={showPreviewHover}
						showPreviewDialog={showPreviewDialog}
						getActions={getActions}
						setQuestionsInvalidate={setQuestionsInvalidate}
					/>
				</div>
			</div>
		</div>
	);
}

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
	Cell,
	Column,
	Dropdown,
	Input,
	Label,
	ListBoxItem,
	Row,
	SearchField,
	type SortDescriptor,
	Switch,
	Table,
	TableBody,
	TableHeader,
	Tag,
	TagGroup,
	TagList,
	useFilter,
	type Selection
} from 'iris-components';
import { fetchCsrf } from '../../../utils';
import { Link, useSearchParams } from 'react-router-dom';
import Pager from '$components/Pager';

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
	setQuestionsInvalidate,
	sortDescriptor,
	setSortDescriptor
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
	sortDescriptor: SortDescriptor;
	setSortDescriptor: Dispatch<SetStateAction<SortDescriptor>>;
}) {
	function recycleQuestion(workspace: string, qid: string, recycle: boolean) {
		let route = `/api/repo/workspaces/${workspace}/questions/${qid}/recycle`;
		if (recycle) route += '?recycle=1';

		fetchCsrf(route).then(() => {
			setQuestionsInvalidate((n) => n + 1);
		});
	}

	return (
		<Table
			className="react-aria-Table w-full hyphens-none"
			aria-label="Questions"
			sortDescriptor={sortDescriptor}
			onSortChange={setSortDescriptor}
		>
			<TableHeader>
				<Column
					id="num"
					className="text-left w-[4ch]"
					allowsSorting
					isRowHeader
				>
					ID
				</Column>
				<Column id="type" className="text-left w-[6ch]" allowsSorting>
					Type
				</Column>
				<Column id="tags" className="text-left">
					Tags
				</Column>
				<Column id="creator" className="text-left" allowsSorting>
					Creator
				</Column>
				<Column id="comment" className="text-left" allowsSorting>
					Comment
				</Column>
				<Column id="operation" className="text-left">
					Operation
				</Column>
			</TableHeader>
			<TableBody>
				{questions.map((q) => (
					<Row key={q.id}>
						<Cell
							onMouseEnter={() => {
								showPreviewHover(q.id, true);
							}}
							onMouseLeave={() => {
								showPreviewHover(q.id, false);
							}}
						>
							{q.num}
						</Cell>
						<Cell>{q.type}</Cell>
						<Cell>
							<TagGroup selectionMode="none" aria-label="Tags">
								<TagList>
									{q.tags.map((t: { id: string; name: string }) => (
										<Tag key={t.id}>{t.name}</Tag>
									))}
								</TagList>
							</TagGroup>
						</Cell>
						<Cell>{q.creator.name}</Cell>
						<Cell>{q.comment}</Cell>
						<Cell className="flex flex-wrap gap-1">
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
						</Cell>
					</Row>
				))}
			</TableBody>
		</Table>
	);
});

export default function QuestionList({
	currentWorkspace,
	workspaces,
	questionsInvalidate,
	setQuestionsInvalidate,
	getActions
}: QuestionListParams) {
	const [searchParams, setSearchParams] = useSearchParams();

	const [workspace, setWorkspace] = useState('');
	const [recycleFilter, setRecycleFilterInternal] = useState(false);
	const [tagFilter, setTagFilterInternal] = useState<Selection>(new Set());

	const actualWorkspace = currentWorkspace ?? workspace;

	const tags = actualWorkspace.length
		? (workspaces.find((w) => w.id === actualWorkspace)?.tags ?? [])
		: [];

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const [questionData, setQuestionData] = useState<any>({});
	const { questions = [], totalNum = 0, pageSize = 0 } = questionData;
	const requestedPageSize = parseInt(searchParams.get('pageSize') ?? '') || 50;
	const pageOffset = parseInt(searchParams.get('pageOffset') ?? '') || 0;

	const [sortDescriptor, setSortDescriptorInternal] = useState<SortDescriptor>({
		column: 'num',
		direction: 'descending'
	});

	function setPageOffset(newPageOffset: number) {
		setSearchParams((prev) => ({
			...Object.fromEntries(prev),
			pageOffset: newPageOffset.toString()
		}));
	}

	function setRecycleFilter(ch: SetStateAction<boolean>) {
		setRecycleFilterInternal(ch);
		setPageOffset(0);
	}

	function setTagFilter(ch: SetStateAction<Selection>) {
		setTagFilterInternal(ch);
		setPageOffset(0);
	}

	function setSortDescriptor(ch: SetStateAction<SortDescriptor>) {
		setSortDescriptorInternal(ch);
		setPageOffset(0);
	}

	if (!actualWorkspace.length && questions.length) {
		setQuestionData({});
		setPageOffset(0);
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

		setPageOffset(0);
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
		if (pageOffset) params.set('offset', String(pageOffset));
		params.set('pageSize', String(requestedPageSize));
		params.set('sortBy', sortDescriptor.column as string);
		params.set(
			'sortDir',
			sortDescriptor.direction === 'ascending' ? 'asc' : 'desc'
		);
		fetch(`/api/repo/workspaces/${actualWorkspace}/questions?${params}`)
			.then((res) => res.json())
			.then(setQuestionData);
	}, [
		questionsInvalidate,
		actualWorkspace,
		recycleFilter,
		tagFilter,
		pageOffset,
		requestedPageSize,
		sortDescriptor
	]);

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
					<Pager totalNum={totalNum} pageSize={pageSize} offset={pageOffset} />
					<QuestionTable
						wid={actualWorkspace}
						questions={questions}
						showPreviewHover={showPreviewHover}
						showPreviewDialog={showPreviewDialog}
						getActions={getActions}
						setQuestionsInvalidate={setQuestionsInvalidate}
						sortDescriptor={sortDescriptor}
						setSortDescriptor={setSortDescriptor}
					/>
					<Pager totalNum={totalNum} pageSize={pageSize} offset={pageOffset} />
				</div>
			</div>
		</div>
	);
}

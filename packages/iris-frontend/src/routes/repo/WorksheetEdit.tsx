import { useCallback, useEffect, useState } from 'react';
import {
	type LoaderFunctionArgs,
	useLoaderData,
	useRevalidator,
	useParams,
	Link
} from 'react-router-dom';
import QuestionList from './components/QuestionList';
import {
	arrayReorder,
	Button,
	Dropdown,
	GridList,
	GridListItem,
	Input,
	ListBoxItem,
	TextField,
	Text,
	useDragAndDrop
} from 'iris-components';
import { WorksheetPreview } from './components/WorksheetPreview';
import { fetchCsrf } from '../../utils';

import Menu from '~icons/tabler/menu';

export async function loader({ params }: LoaderFunctionArgs) {
	const { wid, wsid } = params;

	const out: {
		workspaces?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
		templates?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
		worksheetData?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
	} = {};

	out.workspaces = await fetch('/api/repo/workspaces', {
		cache: 'no-store'
	}).then((res) => res.json());

	out.templates = await fetch('/api/repo/workspaces/all/templates', {
		cache: 'no-store'
	}).then((res) => res.json());

	out.worksheetData = await fetch(
		`/api/repo/workspaces/${wid}/worksheets/${wsid}/revs/latest`,
		{
			cache: 'no-store'
		}
	).then((res) => res.json());

	return out;
}

export function Component() {
	const { wid, wsid } = useParams();
	const { workspaces, templates, worksheetData } = useLoaderData();
	const revalidator = useRevalidator();

	const workspace = workspaces.find((w: { id: string }) => w.id === wid);

	useEffect(() => {
		document.title = `Worksheet #${worksheetData.num} — ${worksheetData.name} • Iris`;
	}, [worksheetData.num, worksheetData.name]);

	const [questionsInvalidate, setQuestionsInvalidate] = useState(0);

	const [newName, setNewName] = useState(worksheetData.name);
	const [newPrivilege, setNewPrivilege] = useState(worksheetData.privilege);

	const [template, setTemplate] = useState(worksheetData.template_id ?? '');
	const [selectedQuestions, setSelectedQuestions] = useState<
		{
			id: string;
			workspace_id: string;
			qid: string;
			rev?: string;
			num: number;
			comment: string;
		}[]
	>(
		worksheetData.data?.questions.map((q: { id: string }) => ({
			...q,
			id: crypto.randomUUID(),
			qid: q.id
		})) ?? []
	);

	const { dragAndDropHooks } = useDragAndDrop({
		getItems: (items) =>
			[...items].map((id) => {
				const question = selectedQuestions.find((q) => q.id === id);
				if (!question) return { 'text/plain': '<unknown>' };
				return {
					'text/plain': `${question.num} — ${question.comment}`
				};
			}),
		onReorder(e) {
			setSelectedQuestions(arrayReorder(selectedQuestions, e));
		}
	});

	const saveMetadata = useCallback(
		(name: string, privilege: number) => {
			fetchCsrf(`/api/repo/workspaces/${wid}/worksheets/${wsid}`, {
				body: JSON.stringify({
					name
				}),
				headers: {
					'Content-Type': 'application/json'
				}
			})
				.then(async () => {
					if (
						workspace.userGroup === 'owner' &&
						privilege !== worksheetData.privilege
					) {
						await fetchCsrf(
							`/api/repo/workspaces/${wid}/worksheets/${wsid}/privilege`,
							{
								body: JSON.stringify({
									privilege
								}),
								headers: {
									'Content-Type': 'application/json'
								}
							}
						);
					}

					revalidator.revalidate();
				})
				.catch(() => {
					revalidator.revalidate();
				});
		},
		[revalidator, wid, wsid, workspace.userGroup, worksheetData.privilege]
	);

	const getWorksheetData = useCallback(
		(questions: typeof selectedQuestions) => {
			return {
				questions: questions.map((q) => ({ id: q.qid, rev: q.rev }))
			};
		},
		[]
	);

	const save = useCallback(
		(questions: typeof selectedQuestions, templateId: string) => {
			fetchCsrf(`/api/repo/workspaces/${wid}/worksheets/${wsid}/revs/new`, {
				body: JSON.stringify({
					data: getWorksheetData(questions),
					template_id: templateId
				}),
				headers: {
					'Content-Type': 'application/json'
				}
			})
				.then(() => {
					revalidator.revalidate();
				})
				.catch(() => {
					revalidator.revalidate();
				});
		},
		[revalidator, wid, wsid, getWorksheetData]
	);

	return (
		<>
			<h1 className="mt-0">
				Worksheet {worksheetData.num} — {worksheetData.name}
			</h1>

			<div className="flex flex-wrap gap-8 items-start">
				<div className="basis-[40%] grow min-w-[35ch]">
					<Button
						onPress={() => save(selectedQuestions, template)}
						isDisabled={!template.length}
					>
						Save
					</Button>
					<Dropdown
						label="Template"
						value={template}
						onChange={(key) => setTemplate(key as string)}
					>
						{templates
							.filter(
								(t: { workspace_id: string; name: string }) =>
									t.workspace_id === wid
							)
							.map((t: { id: string; name: string }) => (
								<ListBoxItem key={t.id} id={t.id}>
									{t.name}
								</ListBoxItem>
							))}
					</Dropdown>

					<h2 className="mt-4">Selected questions</h2>

					{selectedQuestions.length ? (
						<GridList
							aria-label="Selected Questions"
							selectionMode="multiple"
							dragAndDropHooks={dragAndDropHooks}
						>
							{selectedQuestions.map((q) => (
								<GridListItem
									key={q.id}
									id={q.id}
									textValue={`${q.num} — ${q.comment}`}
									className="react-aria-GridListItem border-2 border-iris-200 p-2"
								>
									<Button slot="drag" className="text-iris-400 float-right">
										<Menu />
									</Button>
									<div className="flex flex-col gap-2">
										<Text slot="description">
											<strong>#{q.num}</strong> — {q.comment}
										</Text>
										<div className="flex flex-wrap gap-2">
											<Link
												className="react-aria-Button"
												to={`/repo/workspaces/${q.workspace_id}/questions/${q.qid}`}
											>
												Edit
											</Link>
											<Button
												onPress={() => {
													setSelectedQuestions((qs) =>
														qs.filter((other) => other.id !== q.id)
													);
												}}
											>
												Remove
											</Button>
										</div>
									</div>
								</GridListItem>
							))}
						</GridList>
					) : (
						<p className="my-0">No questions selected.</p>
					)}
				</div>

				{template.length ? (
					<div className="flex flex-col basis-[50%] grow h-172">
						<WorksheetPreview
							wid={wid!}
							wsid={wsid!}
							editorContents={getWorksheetData(selectedQuestions)}
						/>
					</div>
				) : (
					<p className="my-0 grow">Select a template to get started.</p>
				)}
			</div>

			<h2>Metadata</h2>

			<dl className="my-4">
				<dt>Name</dt>
				<dd>
					<TextField value={newName} onChange={setNewName}>
						<Input placeholder="Name" aria-label="Name" />
					</TextField>
				</dd>

				<dt>Initially created by</dt>
				<dd>
					{worksheetData.creator.name} on{' '}
					{new Date(worksheetData.created + 'Z').toLocaleString()}
				</dd>

				{worksheetData.rev_creator && worksheetData.updated && (
					<>
						<dt>Contents updated by</dt>
						<dd>
							{worksheetData.rev_creator.name} on{' '}
							{new Date(worksheetData.updated + 'Z').toLocaleString()}
						</dd>
					</>
				)}

				<dt id="privilegelevel">Privilege level</dt>
				<dd>
					{workspace.userGroup !== 'owner' && (
						<p className="text-sm">
							The privilege level can only be changed by workspace owners.
						</p>
					)}
					<Dropdown
						aria-labelledby="privilegelevel"
						value={newPrivilege}
						onChange={(key) => setNewPrivilege(key as number)}
						isDisabled={workspace.userGroup !== 'owner'}
					>
						<ListBoxItem id={0}>Member</ListBoxItem>
						<ListBoxItem id={128}>Privileged Member</ListBoxItem>
						<ListBoxItem id={32767}>Owner</ListBoxItem>
					</Dropdown>
				</dd>
			</dl>

			<Button onPress={() => saveMetadata(newName, newPrivilege)}>
				Save Metadata
			</Button>

			<div className="mt-18">
				<QuestionList
					workspaces={workspaces}
					questionsInvalidate={questionsInvalidate}
					setQuestionsInvalidate={setQuestionsInvalidate}
					getActions={(q) =>
						!q.deleted && (
							<>
								<Button
									className="react-aria-Button p-0 px-1"
									onPress={() => {
										setSelectedQuestions((qs) => [
											...qs,
											{
												...q,
												qid: q.id,
												id: crypto.randomUUID()
											}
										]);
									}}
								>
									Add
								</Button>
							</>
						)
					}
				/>
			</div>
		</>
	);
}

import { useCallback, useEffect, useRef, useState } from 'react';
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
	useDragAndDrop,
	Label,
	Disclosure,
	DisclosurePanel,
	DisclosureHeader
} from 'iris-components';
import { WorksheetPreview } from './components/WorksheetPreview';
import { fetchCsrf } from '../../utils';

import Menu from '~icons/tabler/menu';

export async function loader({ params }: LoaderFunctionArgs) {
	const { wid, wsid } = params;

	// TODO: handle non-200 response codes
	return {
		workspaces: await fetch('/api/repo/workspaces', {
			cache: 'no-store'
		}).then((res) => res.json()),
		templates: await fetch('/api/repo/workspaces/all/templates', {
			cache: 'no-store'
		}).then((res) => res.json()),
		worksheetData: await fetch(
			`/api/repo/workspaces/${wid}/worksheets/${wsid}/revs/latest`,
			{
				cache: 'no-store'
			}
		).then((res) => res.json())
	};
}

type SelectedQuestions = {
	id: string;
	workspace_id: string;
	qid: string;
	rev?: string;
	num: number;
	comment: string;
}[];

function getWorksheetData(
	questions: SelectedQuestions,
	templateId: string,
	vars: Record<string, string>
) {
	return {
		template: templateId,
		data: {
			questions: questions.map((q) => ({ id: q.qid, rev: q.rev })),
			vars
		}
	};
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
	const [selectedQuestions, setSelectedQuestions] = useState<SelectedQuestions>(
		worksheetData.data?.questions.map((q: { id: string }) => ({
			...q,
			id: crypto.randomUUID(),
			qid: q.id
		})) ?? []
	);

	const [varsInternal, setVars] = useState<string[]>([]);
	const vars = template.length
		? varsInternal.filter((v) => v !== 'SHOW_ANSWER' && v !== 'INCLUDE_CONTENT')
		: [];
	useEffect(() => {
		if (!template.length) {
			return;
		}

		fetch(`/api/repo/workspaces/${wid}/templates/${template}/vars`)
			.then((res) => res.json())
			.then(setVars);
	}, [wid, template]);

	const [varValues, setVarValues] = useState<Record<string, string>>(
		worksheetData.data?.vars ?? {}
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
			const newQuestions = arrayReorder(selectedQuestions, e);
			setSelectedQuestions(newQuestions);
			setPreviewContents(getWorksheetData(newQuestions, template, varValues));
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

	const save = useCallback(
		(
			questions: typeof selectedQuestions,
			templateId: string,
			vars: Record<string, string>
		) => {
			fetchCsrf(`/api/repo/workspaces/${wid}/worksheets/${wsid}/revs/new`, {
				body: JSON.stringify(getWorksheetData(questions, templateId, vars)),
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
		[revalidator, wid, wsid]
	);

	const previewTimeout = useRef<number>(null);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const [previewContents, setPreviewContents] = useState<any>(
		getWorksheetData(selectedQuestions, template, varValues)
	);
	function setPreviewTimeout(data: unknown) {
		if (previewTimeout.current !== null) clearTimeout(previewTimeout.current);
		previewTimeout.current = window.setTimeout(() => {
			setPreviewContents(data);
		}, 1000);
	}

	return (
		<>
			<h1 className="mt-0">
				Worksheet {worksheetData.num} — {worksheetData.name}
			</h1>

			<div className="flex flex-wrap gap-8 items-start">
				<div className="basis-[40%] grow min-w-[35ch]">
					<Button
						onPress={() => save(selectedQuestions, template, varValues)}
						isDisabled={!template.length}
					>
						Save
					</Button>

					<Disclosure
						defaultExpanded={!template.length}
						className="react-aria-Disclosure my-4"
					>
						<DisclosureHeader level={2}>Template</DisclosureHeader>

						<DisclosurePanel>
							<Dropdown
								label="Template"
								value={template}
								onChange={(key) => {
									setTemplate(key as string);
									setPreviewContents(
										getWorksheetData(
											selectedQuestions,
											key as string,
											varValues
										)
									);
								}}
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

							{!!vars.length && (
								<>
									<h3 className="my-4">Variables</h3>
									{vars.map((v) => (
										<TextField
											key={v}
											value={varValues[v]}
											onChange={(newVal) => {
												setVarValues((old) => {
													const newValues = { ...old, [v]: newVal };
													setPreviewTimeout(
														getWorksheetData(
															selectedQuestions,
															template,
															newValues
														)
													);
													return newValues;
												});
											}}
										>
											<Label>
												<code>{v}</code>
											</Label>
											<Input />
										</TextField>
									))}
								</>
							)}
						</DisclosurePanel>
					</Disclosure>

					<Disclosure defaultExpanded className="react-aria-Disclosure my-4">
						<DisclosureHeader level={2}>Selected questions</DisclosureHeader>

						<DisclosurePanel>
							{selectedQuestions.length ? (
								<GridList
									aria-label="Selected Questions"
									selectionMode="multiple"
									dragAndDropHooks={dragAndDropHooks}
									className="react-aria-GridList my-4"
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
															setSelectedQuestions((qs) => {
																const newQuestions = qs.filter(
																	(other) => other.id !== q.id
																);
																setPreviewContents(
																	getWorksheetData(
																		newQuestions,
																		template,
																		varValues
																	)
																);
																return newQuestions;
															});
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
								<p className="my-4">No questions selected.</p>
							)}
						</DisclosurePanel>
					</Disclosure>
				</div>

				{template.length ? (
					<div className="flex flex-col basis-[50%] grow h-172">
						<WorksheetPreview
							wid={wid!}
							wsid={wsid!}
							editorContents={previewContents}
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
										setSelectedQuestions((qs) => {
											const newQuestions = [
												...qs,
												{
													...q,
													qid: q.id,
													id: crypto.randomUUID()
												}
											];

											setPreviewContents(
												getWorksheetData(newQuestions, template, varValues)
											);
											return newQuestions;
										});
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

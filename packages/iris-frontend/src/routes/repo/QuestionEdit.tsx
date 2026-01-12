import { useCallback, useEffect, useRef, useState } from 'react';
import {
	Form,
	useLoaderData,
	useParams,
	useRevalidator,
	type LoaderFunctionArgs
} from 'react-router-dom';
import useAuthorization from '$hooks/useAuthorization';
import {
	Button,
	Checkbox,
	CheckboxGroup,
	Input,
	TextField
} from 'iris-components';
import { useMediaQuery } from 'react-responsive';
import { fetchCsrf } from '../../utils';

import { useSelector } from 'react-redux';
import { type RootState } from '$state/store';

import CodeMirror from '@uiw/react-codemirror';
import { EditorView } from '@codemirror/view';
import { latex } from 'codemirror-lang-latex';
import { githubDark, githubLight } from '@uiw/codemirror-theme-github';
import { QuestionPreview } from './QuestionPreview';

export async function loader({ params }: LoaderFunctionArgs) {
	const { wid, qid } = params;

	const out: {
		workspaces?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
		questionData?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
	} = {};

	out.workspaces = await fetch('/api/repo/workspaces', {
		cache: 'no-store'
	}).then((res) => res.json());

	out.questionData = await fetch(
		`/api/repo/workspaces/${wid}/questions/${qid}/revs/latest`,
		{
			cache: 'no-store'
		}
	).then((res) => res.json());

	return out;
}

export function Component() {
	useAuthorization({ required: true, group: 'repo:users' });

	const { wid, qid } = useParams();
	const { workspaces, questionData } = useLoaderData();
	const revalidator = useRevalidator();

	const tags = workspaces.find((w: { id: string }) => w.id === wid)?.tags;

	const editor = useRef<EditorView | null>(null);

	const theme = useSelector((state: RootState) => state.prefs.theme);
	const prefersDark = useMediaQuery({ query: '(prefers-color-scheme: dark)' });
	const dark = theme === 'auto' ? prefersDark : theme === 'dark';

	const [newComment, setNewComment] = useState(questionData.comment);
	const [newTags, setNewTags] = useState<string[]>(
		questionData.tags.map((t: { id: string }) => t.id)
	);

	const previewTimeout = useRef<number>(null);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const [previewContents, setPreviewContents] = useState<any>(
		questionData.data
	);

	useEffect(() => {
		document.title = `Question #${questionData.num} • Iris`;
	}, [questionData.num]);

	const saveContentsLatex = useCallback(
		(contents: string) => {
			fetchCsrf(`/api/repo/workspaces/${wid}/questions/${qid}/revs/new`, {
				body: JSON.stringify({
					data: {
						...questionData.data,
						code: contents
					},
					derived_from: questionData.derived_from
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
		[revalidator, wid, qid, questionData]
	);

	const saveMetadata = useCallback(
		(comment: string, tags: string[]) => {
			fetchCsrf(`/api/repo/workspaces/${wid}/questions/${qid}`, {
				body: JSON.stringify({
					comment,
					tags
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
		[revalidator, wid, qid]
	);

	const deleteMedia = useCallback(
		(filename: string) => {
			fetchCsrf(
				`/api/repo/workspaces/${wid}/questions/${qid}/media/${filename}`,
				{
					method: 'DELETE'
				}
			)
				.then(() => {
					revalidator.revalidate();
				})
				.catch(() => {
					revalidator.revalidate();
				});
		},
		[revalidator, wid, qid]
	);

	// this is nasty
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const questionDataRef = useRef<any>(null);
	// eslint-disable-next-line react-hooks/refs
	questionDataRef.current = questionData;
	function setPreviewTimeout() {
		if (previewTimeout.current !== null) clearTimeout(previewTimeout.current);
		previewTimeout.current = window.setTimeout(() => {
			setPreviewContents({
				...questionDataRef.current?.data,
				code: editor.current?.state.doc.toString() ?? ''
			});
		}, 1000);
	}

	return (
		<>
			<h1 className="mt-0">Question #{questionData.num}</h1>

			<div className="my-4 flex gap-2 flex-wrap">
				<Button
					onPress={() =>
						saveContentsLatex(editor.current?.state.doc.toString() ?? '')
					}
				>
					Save Contents
				</Button>
			</div>

			<div className="flex flex-wrap gap-2 items-start">
				{questionData.type === 'latex' && (
					<CodeMirror
						className="basis-[40%] grow min-w-[60ch]"
						theme={dark ? githubDark : githubLight}
						value={questionData.data?.code ?? ''}
						extensions={[
							EditorView.lineWrapping,
							latex({
								autoCloseBrackets: false,
								enableLinting: false
							})
						]}
						basicSetup={{ closeBrackets: false }}
						onCreateEditor={(view) => {
							editor.current = view;
							view.focus();
						}}
						onChange={() => {
							setPreviewTimeout();
						}}
					/>
				)}
				<div className="flex flex-col grow basis-[50%] h-172">
					<QuestionPreview
						wid={wid!}
						question={{ id: qid!, num: questionData.num }}
						editorContents={previewContents}
					/>
				</div>
			</div>

			<h2>Metadata</h2>

			<dl className="my-4">
				<dt>Comment</dt>
				<dd>
					<TextField value={newComment} onChange={setNewComment}>
						<Input placeholder="Comment" aria-label="Comment" />
					</TextField>
				</dd>

				<dt>Tags</dt>
				<dd>
					<CheckboxGroup
						aria-label="Tags"
						value={newTags}
						onChange={setNewTags}
					>
						<div className="flex flex-wrap gap-x-4 text-sm">
							{tags.map((t: { id: string; name: string }) => (
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
				</dd>

				<dt>Question type</dt>
				<dd>{questionData.type}</dd>

				<dt>Question created by</dt>
				<dd>
					{questionData.creator.name} on{' '}
					{new Date(questionData.created + 'Z').toLocaleString()}
				</dd>

				{questionData.rev_creator && questionData.updated && (
					<>
						<dt>Contents updated by</dt>
						<dd>
							{questionData.rev_creator.name} on{' '}
							{new Date(questionData.updated + 'Z').toLocaleString()}
						</dd>
					</>
				)}

				<dt>Privilege level</dt>
				<dd>{questionData.privilege}</dd>
			</dl>

			<Button onPress={() => saveMetadata(newComment, newTags)}>
				Save Metadata
			</Button>

			<h2>Media</h2>

			<Form
				onSubmit={(e) => {
					e.preventDefault();

					const form = e.currentTarget;
					const formData = new FormData(form);

					fetchCsrf(`/api/repo/workspaces/${wid}/questions/${qid}/media`, {
						body: formData
					}).then(() => {
						form.reset();
						revalidator.revalidate();
						setPreviewTimeout();
					});
				}}
			>
				<Input name="file" type="file" required />
				<Button type="submit">Upload File</Button>
			</Form>

			{questionData.data?.media && (
				<ul>
					{Object.keys(questionData.data.media).map((filename) => (
						<li key={filename}>
							{filename}
							<div className="flex flex-wrap gap-2">
								<Button
									onPress={() => {
										window.location.href = `/api/repo/workspaces/${wid}/questions/${qid}/media/${filename}`;
									}}
								>
									Download
								</Button>
								<Button
									onPress={() => {
										deleteMedia(filename);
										setPreviewTimeout();
									}}
								>
									Delete
								</Button>
							</div>
						</li>
					))}
				</ul>
			)}
		</>
	);
}

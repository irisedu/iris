import { useCallback, useEffect, useRef, useState } from 'react';
import {
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
import type { EditorView } from '@codemirror/view';
import { latex } from 'codemirror-lang-latex';
import { githubDark, githubLight } from '@uiw/codemirror-theme-github';

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

	const sessionId = useRef(crypto.randomUUID());

	const { wid, qid } = useParams();
	const { workspaces, questionData } = useLoaderData();
	const revalidator = useRevalidator();

	const tags = workspaces.find((w: { id: string }) => w.id === wid)?.tags;

	const editor = useRef<EditorView | null>(null);

	const theme = useSelector((state: RootState) => state.prefs.theme);
	const prefersDark = useMediaQuery({ query: '(prefers-color-scheme: dark)' });
	const dark = theme === 'auto' ? prefersDark : theme === 'dark';

	const [newComment, setNewComment] = useState('');
	const [newTags, setNewTags] = useState<string[]>([]);

	useEffect(() => {
		document.title = `Question #${questionData.num} • Iris`;

		setNewComment(questionData.comment);
		setNewTags(questionData.tags.map((t: { id: string }) => t.id));
	}, [questionData]);

	const saveContentsLatex = useCallback(
		(contents: string) => {
			fetchCsrf(`/api/repo/workspaces/${wid}/questions/${qid}/revs/new`, {
				body: JSON.stringify({
					data: {
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

	return (
		<>
			<h1 className="mt-0">Question #{questionData.num}</h1>

			<div className="flex gap-2 flex-wrap">
				<Button>Preview</Button>
				<Button
					onPress={() =>
						saveContentsLatex(editor.current?.state.doc.toString() ?? '')
					}
				>
					Save Contents
				</Button>
			</div>

			{questionData.type === 'latex' && (
				<CodeMirror
					className="my-4"
					theme={dark ? githubDark : githubLight}
					value={questionData.data?.code ?? ''}
					extensions={[
						latex({
							autoCloseBrackets: false
						})
					]}
					basicSetup={{ closeBrackets: false }}
					onCreateEditor={(view) => {
						editor.current = view;
						view.focus();
					}}
				/>
			)}

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

				<dt>Question creator</dt>
				<dd>{questionData.creator.name}</dd>

				<dt>Question created</dt>
				<dd>{new Date(questionData.created + 'Z').toLocaleString()}</dd>

				{questionData.updated && (
					<>
						<dt>Question contents updated</dt>
						<dd>{new Date(questionData.updated + 'Z').toLocaleString()}</dd>
					</>
				)}

				<dt>Privilege level</dt>
				<dd>{questionData.privilege}</dd>
			</dl>

			<Button onPress={() => saveMetadata(newComment, newTags)}>
				Save Metadata
			</Button>
		</>
	);
}

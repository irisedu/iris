import { useCallback, useRef, useState } from 'react';
import useAuthorization from '$hooks/useAuthorization';
import { fetchCsrf } from '../../utils';
import { Button, DeleteDialog, Input, TextField } from 'iris-components';

export default function Workspace({
	data,
	onRevalidate
}: {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	data: any;
	onRevalidate: () => void;
}) {
	const user = useAuthorization({});
	const [addMemberEmail, setAddMemberEmail] = useState('');
	const [addTagName, setAddTagName] = useState('');

	const addMember = useCallback(
		(email: string) => {
			if (!email.length) return;
			fetchCsrf(`/api/repo/workspaces/${data.id}/members/invite?email=${email}`)
				.then(() => {
					onRevalidate();
					setAddMemberEmail('');
				})
				.catch(() => {
					onRevalidate();
					setAddMemberEmail('');
				});
		},
		[data, onRevalidate]
	);

	const removeMember = useCallback(
		(id: string) => {
			fetchCsrf(`/api/repo/workspaces/${data.id}/members/${id}`, {
				method: 'DELETE'
			})
				.then(() => {
					onRevalidate();
				})
				.catch(() => {
					onRevalidate();
				});
		},
		[data, onRevalidate]
	);

	const setMemberGroup = useCallback(
		(id: string, group: string) => {
			fetchCsrf(
				`/api/repo/workspaces/${data.id}/members/${id}/group?group=${group}`
			)
				.then(() => {
					onRevalidate();
				})
				.catch(() => {
					onRevalidate();
				});
		},
		[data, onRevalidate]
	);

	const addTag = useCallback(
		(name: string) => {
			if (!name.length) return;

			fetchCsrf(`/api/repo/workspaces/${data.id}/tags/new?name=${name}`)
				.then(() => {
					setAddTagName('');
					onRevalidate();
				})
				.catch(() => {
					setAddTagName('');
					onRevalidate();
				});
		},
		[data, onRevalidate]
	);

	const [deleteOpen, setDeleteOpen] = useState(false);
	const deleteCb = useRef<(() => void) | null>(null);
	const [deleteTarget, setDeleteTarget] = useState('');

	const deleteTag = useCallback(
		(id: string) => {
			fetchCsrf(`/api/repo/workspaces/${data.id}/tags/${id}`, {
				method: 'DELETE'
			})
				.then(() => {
					onRevalidate();
				})
				.catch(() => {
					onRevalidate();
				});
		},
		[data, onRevalidate]
	);

	const deleteTagPrompt = useCallback(
		(id: string, name: string, count: number) => {
			if (count > 0) {
				setDeleteTarget(name);
				deleteCb.current = () => deleteTag(id);
				setDeleteOpen(true);
			} else {
				deleteTag(id);
			}
		},
		[deleteTag]
	);

	return (
		<>
			<DeleteDialog
				isOpen={deleteOpen}
				setIsOpen={setDeleteOpen}
				callbackRef={deleteCb}
			>
				The tag “{deleteTarget}” has one or more questions associated with it.
				Are you sure you want to delete it? This action is irreversible.
			</DeleteDialog>
			<li
				key={data.id}
				className="list-none p-2 bg-iris-100 border-2 border-iris-200 rounded-md"
			>
				<h2 className="m-0">{data.name}</h2>

				<p className="text-sm m-0!">
					Questions: {data.numQuestions}, Worksheets: {data.numWorksheets}
				</p>

				<h3 className="m-0 mt-2">Members</h3>

				<div className="flex flex-wrap gap-2 mb-3">
					<TextField
						value={addMemberEmail}
						onChange={setAddMemberEmail}
						className="react-aria-TextField m-0 max-w-full"
					>
						<Input placeholder="Email" aria-label="Email" />
					</TextField>
					<Button onPress={() => addMember(addMemberEmail)}>Add Member</Button>
				</div>

				<ul className="m-0!">
					{data.members.map(
						(
							m: any // eslint-disable-line @typescript-eslint/no-explicit-any
						) => (
							<li key={m.id}>
								{user?.type === 'registered' && user.data.id === m.id ? (
									<strong>
										{m.name} (you) — {m.group}
									</strong>
								) : (
									`${m.name} — ${m.group}`
								)}
								{user?.type === 'registered' &&
									data.userGroup === 'owner' &&
									user.data.id !== m.id && (
										<span className="mx-4 inline-flex flex-wrap gap-2">
											<Button onPress={() => removeMember(m.id)}>Remove</Button>
											<Button onPress={() => setMemberGroup(m.id, 'owner')}>
												Set as Owner
											</Button>
											<Button onPress={() => setMemberGroup(m.id, 'member')}>
												Set as Member
											</Button>
										</span>
									)}
							</li>
						)
					)}
				</ul>

				<h3 className="m-0 mt-2">Tags</h3>

				<div className="flex flex-wrap gap-2 mb-3">
					<TextField
						value={addTagName}
						onChange={setAddTagName}
						className="react-aria-TextField m-0 max-w-full"
					>
						<Input placeholder="Tag Name" aria-label="Tag Name" />
					</TextField>
					<Button onPress={() => addTag(addTagName)}>Add Tag</Button>
				</div>

				<ul className="m-0!">
					{data.tags.map(
						(
							t: any // eslint-disable-line @typescript-eslint/no-explicit-any
						) => (
							<li key={t.id}>
								{t.name} —{' '}
								<span className="text-sm">{t.numQuestions} question(s)</span>
								<span className="mx-4 inline-flex flex-wrap gap-2">
									<Button
										onPress={() =>
											deleteTagPrompt(t.id, t.name, t.numQuestions)
										}
									>
										Delete
									</Button>
								</span>
							</li>
						)
					)}
				</ul>
			</li>
		</>
	);
}

import { useCallback, useRef, useState } from 'react';
import { fetchCsrf } from '../../utils';
import useAuthorization from '$hooks/useAuthorization';

import {
	Button,
	Input,
	TextField,
	DeleteDialog,
	Dropdown,
	ListBoxItem
} from 'iris-components';

export interface WorkspacesParams {
	isInstructor: boolean;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	workspace: any;
	templates: {
		id: string;
		workspace_id: string;
		name: string;
		hash: string;
	}[];
	onRevalidate: () => void;
}

export default function Workspaces({
	workspace,
	templates,
	isInstructor,
	onRevalidate
}: WorkspacesParams) {
	const user = useAuthorization({});

	const [newWorkspaceName, setNewWorkspaceName] = useState('');

	const newWorkspace = useCallback(
		(name: string) => {
			if (!name.length) return;
			fetchCsrf(`/api/repo/workspaces/new?name=${name}`, {
				body: JSON.stringify({ name }),
				headers: {
					'Content-Type': 'application/json'
				}
			}).then(() => {
				onRevalidate();
				setNewWorkspaceName('');
			});
		},
		[onRevalidate]
	);

	const [addMemberEmail, setAddMemberEmail] = useState('');
	const [addTagName, setAddTagName] = useState('');

	const setNewPreviewTemplate = useCallback(
		(id: string | null) => {
			if ((id !== null && !id.length) || workspace.previewTemplate === id) {
				return;
			}

			fetchCsrf(`/api/repo/workspaces/${workspace.id}/preview-template`, {
				body: JSON.stringify({ id }),
				headers: {
					'Content-Type': 'application/json'
				}
			})
				.then(() => {
					onRevalidate();
				})
				.catch(() => {
					onRevalidate();
				});
		},
		[onRevalidate, workspace.id, workspace.previewTemplate]
	);

	const addMember = useCallback(
		(email: string) => {
			if (!email.length) return;
			fetchCsrf(`/api/repo/workspaces/${workspace.id}/members/invite`, {
				body: JSON.stringify({ email }),
				headers: {
					'Content-Type': 'application/json'
				}
			})
				.then(() => {
					onRevalidate();
					setAddMemberEmail('');
				})
				.catch(() => {
					onRevalidate();
					setAddMemberEmail('');
				});
		},
		[workspace, onRevalidate]
	);

	const removeMember = useCallback(
		(id: string) => {
			fetchCsrf(`/api/repo/workspaces/${workspace.id}/members/${id}`, {
				method: 'DELETE'
			})
				.then(() => {
					onRevalidate();
				})
				.catch(() => {
					onRevalidate();
				});
		},
		[workspace, onRevalidate]
	);

	const setMemberGroup = useCallback(
		(id: string, group: string) => {
			fetchCsrf(`/api/repo/workspaces/${workspace.id}/members/${id}/group`, {
				body: JSON.stringify({ group }),
				headers: {
					'Content-Type': 'application/json'
				}
			})
				.then(() => {
					onRevalidate();
				})
				.catch(() => {
					onRevalidate();
				});
		},
		[workspace, onRevalidate]
	);

	const addTag = useCallback(
		(name: string) => {
			if (!name.length) return;

			fetchCsrf(`/api/repo/workspaces/${workspace.id}/tags/new`, {
				body: JSON.stringify({ name }),
				headers: {
					'Content-Type': 'application/json'
				}
			})
				.then(() => {
					setAddTagName('');
					onRevalidate();
				})
				.catch(() => {
					setAddTagName('');
					onRevalidate();
				});
		},
		[workspace, onRevalidate]
	);

	const [deleteOpen, setDeleteOpen] = useState(false);
	const deleteCb = useRef<(() => void) | null>(null);
	const [deleteTarget, setDeleteTarget] = useState('');

	const deleteTag = useCallback(
		(id: string) => {
			fetchCsrf(`/api/repo/workspaces/${workspace.id}/tags/${id}`, {
				method: 'DELETE'
			})
				.then(() => {
					onRevalidate();
				})
				.catch(() => {
					onRevalidate();
				});
		},
		[workspace, onRevalidate]
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
			{isInstructor && (
				<div className="flex flex-wrap gap-2 mb-3">
					<TextField
						value={newWorkspaceName}
						onChange={setNewWorkspaceName}
						className="react-aria-TextField m-0 max-w-full"
					>
						<Input placeholder="Workspace Name" aria-label="Workspace Name" />
					</TextField>
					<Button onPress={() => newWorkspace(newWorkspaceName)}>
						New Workspace
					</Button>
				</div>
			)}

			<DeleteDialog
				isOpen={deleteOpen}
				setIsOpen={setDeleteOpen}
				callbackRef={deleteCb}
			>
				The tag “{deleteTarget}” has one or more questions associated with it.
				Are you sure you want to delete it? This action is irreversible.
			</DeleteDialog>
			<h2 className="m-0">{workspace.name}</h2>

			<p className="text-sm m-0!">
				Questions: {workspace.numQuestions}, Worksheets:{' '}
				{workspace.numWorksheets}
			</p>

			<Dropdown
				label="Preview Template"
				value={workspace.previewTemplate ?? ''}
				onChange={(key) =>
					setNewPreviewTemplate(key === 'null' ? null : (key as string))
				}
			>
				<ListBoxItem id="null">(unset)</ListBoxItem>
				{templates
					.filter((t) => t.workspace_id === workspace.id && t.hash)
					.map((t) => (
						<ListBoxItem key={t.id} id={t.id}>
							{t.name}
						</ListBoxItem>
					))}
			</Dropdown>

			<h3 className="m-0 my-2">Members</h3>

			{workspace.userGroup === 'owner' && (
				<>
					<p className="my-2">
						New workspace members must have an Iris account prior to being
						added.
					</p>

					<div className="flex flex-wrap gap-2 mb-3">
						<TextField
							value={addMemberEmail}
							onChange={setAddMemberEmail}
							className="react-aria-TextField m-0 max-w-full"
						>
							<Input placeholder="Email" aria-label="Email" />
						</TextField>
						<Button onPress={() => addMember(addMemberEmail)}>
							Add Member
						</Button>
					</div>
				</>
			)}

			<table className="mx-0">
				<thead className="text-left">
					<tr>
						<th>Name</th>
						<th>Group</th>
						{workspace.userGroup === 'owner' && <th>Operation</th>}
					</tr>
				</thead>
				<tbody>
					{workspace.members.map(
						(
							m: any // eslint-disable-line @typescript-eslint/no-explicit-any
						) => (
							<tr key={m.id}>
								<td>
									{user?.type === 'registered' && user.data.id === m.id ? (
										<strong>{m.name} (you)</strong>
									) : (
										m.name
									)}
								</td>
								<td>
									{user?.type === 'registered' &&
									workspace.userGroup === 'owner' &&
									user.data.id !== m.id ? (
										<Dropdown
											aria-label="Group"
											value={m.group}
											onChange={(key) => setMemberGroup(m.id, key as string)}
											isDisabled={
												workspace.userGroup !== 'owner' ||
												(user?.type === 'registered' && user.data.id === m.id)
											}
											className="react-aria-Select my-0"
										>
											<ListBoxItem id="member">Member</ListBoxItem>
											<ListBoxItem id="privilegedmember">
												Privileged Member
											</ListBoxItem>
											<ListBoxItem id="owner">Owner</ListBoxItem>
										</Dropdown>
									) : (
										m.group
									)}
								</td>
								{user?.type === 'registered' &&
									workspace.userGroup === 'owner' && (
										<td className="flex flex-wrap gap-1">
											{user.data.id !== m.id ? (
												<Button onPress={() => removeMember(m.id)}>
													Remove
												</Button>
											) : (
												<em>you cannot operate on yourself</em>
											)}
										</td>
									)}
							</tr>
						)
					)}
				</tbody>
			</table>

			<h3 className="m-0 my-2">Tags</h3>

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

			<table className="mx-0">
				<thead className="text-left">
					<tr>
						<th>Name</th>
						<th>Question count</th>
						<th>Operation</th>
					</tr>
				</thead>
				<tbody>
					{workspace.tags.map(
						(
							t: any // eslint-disable-line @typescript-eslint/no-explicit-any
						) => (
							<tr key={t.id}>
								<td>{t.name}</td>
								<td>{t.numQuestions}</td>
								<td className="flex flex-wrap gap-1">
									<Button
										className="react-aria-Button p-0 px-1"
										onPress={() =>
											deleteTagPrompt(t.id, t.name, t.numQuestions)
										}
									>
										Delete
									</Button>
								</td>
							</tr>
						)
					)}
				</tbody>
			</table>
		</>
	);
}

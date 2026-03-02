import { useCallback, useState } from 'react';
import { fetchCsrf } from '../../utils';

import Workspace from './components/Workspace';
import { Button, Input, TextField } from 'iris-components';

export interface WorkspacesParams {
	isInstructor: boolean;
	workspaces: object[];
	templates: {
		id: string;
		workspace_id: string;
		name: string;
		hash: string;
	}[];
	onRevalidate: () => void;
}

export default function Workspaces({
	workspaces,
	templates,
	isInstructor,
	onRevalidate
}: WorkspacesParams) {
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
					<Button onPress={() => newWorkspace(newWorkspaceName)}>Create</Button>
				</div>
			)}
			<ul className="flex flex-col gap-3 p-0">
				{workspaces?.map(
					(
						w: any // eslint-disable-line @typescript-eslint/no-explicit-any
					) => (
						<Workspace
							key={w.id}
							data={w}
							templates={templates}
							onRevalidate={onRevalidate}
						/>
					)
				)}
			</ul>
		</>
	);
}

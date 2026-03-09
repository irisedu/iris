import { useEffect, useState } from 'react';
import { Button, Input, TextField } from 'iris-components';
import { fetchCsrf } from '../../utils';
import { Link } from 'react-router-dom';

export interface WorksheetsProps {
	currentWorkspace: string;
}

export default function Worksheets({ currentWorkspace }: WorksheetsProps) {
	const [createName, setCreateName] = useState('');

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const [worksheets, setWorksheets] = useState<any[]>([]);
	const [worksheetsInvalidate, setWorksheetsInvalidate] = useState(0);

	useEffect(() => {
		fetch(`/api/repo/workspaces/${currentWorkspace}/worksheets`)
			.then((res) => res.json())
			.then(setWorksheets);
	}, [worksheetsInvalidate, currentWorkspace]);

	function createWorksheet(workspace: string, name: string) {
		fetchCsrf(`/api/repo/workspaces/${workspace}/worksheets/new`, {
			body: JSON.stringify({ name }),
			headers: {
				'Content-Type': 'application/json'
			}
		}).then(() => {
			setWorksheetsInvalidate((n) => n + 1);
			setCreateName('');
		});
	}

	return (
		<>
			<div className="flex flex-wrap gap-2 mb-3">
				<TextField
					value={createName}
					onChange={setCreateName}
					className="react-aria-TextField m-0 max-w-full"
				>
					<Input placeholder="Worksheet Name" />
				</TextField>

				<Button
					onPress={() => {
						if (!currentWorkspace.length || !createName.length) return;
						createWorksheet(currentWorkspace, createName);
					}}
				>
					New Worksheet
				</Button>
			</div>

			<table className="w-full hyphens-none">
				<thead>
					<tr>
						<th className="text-left w-[4ch]">ID</th>
						<th className="text-left">Name</th>
						<th className="text-left">Creator</th>
						<th className="text-left">Operation</th>
					</tr>
				</thead>
				<tbody>
					{worksheets.map((w) => (
						<tr key={w.id}>
							<td>{w.num}</td>
							<td>{w.name}</td>
							<td>{w.creator.name}</td>
							<td className="flex flex-wrap gap-1">
								<Link
									className="react-aria-Button p-0 px-1"
									to={`/repo/workspaces/${w.workspace_id}/worksheets/${w.id}`}
								>
									Edit
								</Link>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</>
	);
}

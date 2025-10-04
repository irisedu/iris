import { useCallback, useState } from 'react';
import useAuthorization from '$hooks/useAuthorization';
import { fetchCsrf } from '../../utils';
import { Button, Input, TextField } from 'iris-components';

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

	return (
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
		</li>
	);
}

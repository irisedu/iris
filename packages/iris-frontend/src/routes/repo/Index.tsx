import { useState, useEffect, useCallback } from 'react';
import { useRevalidator, useLoaderData } from 'react-router-dom';
import useAuthorization from '$hooks/useAuthorization';
import {
	Tabs,
	TabList,
	Tab,
	TabPanel,
	Input,
	TextField,
	Button
} from 'iris-components';

import store from '$state/store';
import { fetchCsrf } from '../../utils';

import QuestionList from './QuestionList';
import TemplateList from './TemplateList';
import Workspace from './Workspace';

export async function loader() {
	const { user } = store.getState().user;

	const out: {
		workspaces?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
		templates?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
	} = {};

	if (user?.type !== 'registered') return out;

	out.workspaces = await fetch('/api/repo/workspaces', {
		cache: 'no-store'
	}).then((res) => res.json());

	out.templates = await fetch('/api/repo/workspaces/all/templates', {
		cache: 'no-store'
	}).then((res) => res.json());

	return out;
}

export function Component() {
	const user = useAuthorization({ required: true, group: 'repo:users' });
	const isInstructor =
		user?.type === 'registered' && user.groups.includes('repo:instructors');

	const { workspaces, templates } = useLoaderData();
	const revalidator = useRevalidator();

	const [newWorkspaceName, setNewWorkspaceName] = useState('');

	useEffect(() => {
		document.title = 'Question Repo • Iris';
	}, []);

	useEffect(() => {
		// Depending on load order, may need to fetch again when user loads in
		revalidator.revalidate();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [user]);

	const newWorkspace = useCallback(
		(name: string) => {
			if (!name.length) return;
			fetchCsrf(`/api/repo/workspaces/new?name=${name}`, {
				body: JSON.stringify({ name }),
				headers: {
					'Content-Type': 'application/json'
				}
			}).then(() => {
				revalidator.revalidate();
				setNewWorkspaceName('');
			});
		},
		[revalidator]
	);

	return (
		<>
			<h1 className="mt-0">Question Repo</h1>

			<Tabs className="link-tabs">
				<TabList>
					<Tab id="questions">Questions</Tab>
					<Tab id="worksheets">Worksheets</Tab>
					<Tab id="templates">Templates</Tab>
					<Tab id="workspaces">Workspaces</Tab>
				</TabList>

				<TabPanel id="questions">
					<QuestionList workspaces={workspaces} />
				</TabPanel>

				<TabPanel id="worksheets">Worksheets</TabPanel>

				<TabPanel id="templates">
					<TemplateList
						workspaces={workspaces}
						templates={templates}
						onRevalidate={() => revalidator.revalidate()}
					/>
				</TabPanel>

				<TabPanel id="workspaces">
					{isInstructor && (
						<div className="flex flex-wrap gap-2 mb-3">
							<TextField
								value={newWorkspaceName}
								onChange={setNewWorkspaceName}
								className="react-aria-TextField m-0 max-w-full"
							>
								<Input
									placeholder="Workspace Name"
									aria-label="Workspace Name"
								/>
							</TextField>
							<Button onPress={() => newWorkspace(newWorkspaceName)}>
								Create
							</Button>
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
									onRevalidate={() => revalidator.revalidate()}
								/>
							)
						)}
					</ul>
				</TabPanel>
			</Tabs>
		</>
	);
}

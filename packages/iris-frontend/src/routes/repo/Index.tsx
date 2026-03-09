import { useEffect, useState } from 'react';
import {
	useRevalidator,
	useLoaderData,
	useSearchParams
} from 'react-router-dom';
import useAuthorization from '$hooks/useAuthorization';
import {
	Tabs,
	TabList,
	Tab,
	TabPanel,
	Dropdown,
	ListBoxItem
} from 'iris-components';

import store from '$state/store';

import Questions from './Questions';
import Templates from './Templates';
import Worksheets from './Worksheets';
import Workspaces from './Workspaces';

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
	const [searchParams, setSearchParams] = useSearchParams();

	const [currentTab, setCurrentTabInternal] = useState(
		searchParams.get('tab') ?? 'questions'
	);

	function setCurrentTab(key: string) {
		setSearchParams((prev) => ({ ...Object.fromEntries(prev), tab: key }));
		setCurrentTabInternal(key);
	}

	let initialWorkspace = searchParams.get('workspace');
	if (
		!initialWorkspace ||
		!workspaces.some((w: { id: string }) => w.id === initialWorkspace)
	) {
		initialWorkspace = workspaces.length ? workspaces[0].id : '';
	}
	const [currentWorkspace, setCurrentWorkspaceInternal] = useState<string>(
		initialWorkspace as string
	);

	function setCurrentWorkspace(key: string) {
		setSearchParams((prev) => ({
			...Object.fromEntries(prev),
			workspace: key
		}));
		setCurrentWorkspaceInternal(key);
	}

	useEffect(() => {
		document.title = 'Question Repo • Iris';
	}, []);

	useEffect(() => {
		// Depending on load order, may need to fetch again when user loads in
		revalidator.revalidate();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [user]);

	return (
		<>
			<div className="flex flex-wrap gap-4 items-center">
				<h1 className="my-0">Question Repo</h1>
				<Dropdown
					aria-label="Current Workspace"
					value={currentWorkspace}
					onChange={(key) => setCurrentWorkspace(key as string)}
				>
					{workspaces?.map((w: { id: string; name: string }) => (
						<ListBoxItem key={w.id} id={w.id}>
							{w.name}
						</ListBoxItem>
					))}
				</Dropdown>
			</div>

			<Tabs
				className="link-tabs"
				selectedKey={currentTab}
				onSelectionChange={(key) => setCurrentTab(key as string)}
			>
				<TabList>
					<Tab id="questions">Questions</Tab>
					<Tab id="worksheets">Worksheets</Tab>
					<Tab id="templates">Templates</Tab>
					<Tab id="workspaces">Workspaces</Tab>
				</TabList>

				<TabPanel id="questions">
					<Questions
						currentWorkspace={currentWorkspace}
						workspaces={workspaces}
					/>
				</TabPanel>

				<TabPanel id="worksheets">
					<Worksheets currentWorkspace={currentWorkspace} />
				</TabPanel>

				<TabPanel id="templates">
					<Templates
						currentWorkspace={currentWorkspace}
						templates={templates}
						onRevalidate={() => revalidator.revalidate()}
					/>
				</TabPanel>

				<TabPanel id="workspaces">
					<Workspaces
						workspaces={workspaces}
						templates={templates}
						isInstructor={isInstructor}
						onRevalidate={() => revalidator.revalidate()}
					/>
				</TabPanel>
			</Tabs>
		</>
	);
}

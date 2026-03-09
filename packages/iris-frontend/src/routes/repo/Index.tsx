import { useEffect, useState } from 'react';
import {
	useRevalidator,
	useLoaderData,
	useSearchParams
} from 'react-router-dom';
import useAuthorization from '$hooks/useAuthorization';
import { Tabs, TabList, Tab, TabPanel } from 'iris-components';

import store from '$state/store';

import Questions from './Questions';
import Templates from './Templates';
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
			<h1 className="mt-0">Question Repo</h1>

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
					<Questions workspaces={workspaces} />
				</TabPanel>

				<TabPanel id="worksheets">Worksheets</TabPanel>

				<TabPanel id="templates">
					<Templates
						workspaces={workspaces}
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

import { useState, useEffect } from 'react';
import Iris from '$assets/iris-word.svg?react';
import irisLogo from '$assets/iris-mono.svg';

import type { TabData, TabRender } from '$state/tabsSlice';

function WelcomeTab() {
	const [version, setVersion] = useState('...');

	useEffect(() => {
		app.getVersion().then(setVersion);
	}, []);

	return (
		<div className="flex flex-col items-center m-2">
			<Iris className="fill-black max-w-72" />
			<p className="text-lg font-sans">Iris Studio, version {version}</p>
		</div>
	);
}

export const data: TabData = { id: 'studio-welcome', type: 'normal' };
export const tab: TabRender = {
	id: data.id,
	title: 'Welcome',
	icon: (
		<img
			src={irisLogo}
			alt="Iris logo"
			className="w-6 h-6 brightness-75 dark:brightness-150"
		/>
	),
	view: <WelcomeTab />
};

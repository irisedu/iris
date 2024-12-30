import { useState, useEffect, type ReactNode } from 'react';
import { Button, type ButtonProps } from 'iris-components';
import Iris from '$assets/iris-word.svg?react';
import irisLogo from '$assets/iris-mono.svg';

import type { TabData, TabRender } from '$state/tabsSlice';

import ArrowRight from '~icons/tabler/arrow-right';

function WelcomeButton(attrs: { children: ReactNode } & ButtonProps) {
	return (
		<Button
			{...attrs}
			className={`group relative text-left text-lg w-full p-2 rounded-md shadow-md ${attrs.className}`}
		>
			{attrs.children}
			<ArrowRight className="absolute w-6 h-6 inset-y-1/2 my-auto right-4 opacity-0 md:group-hover:opacity-100 transition-opacity duration-200" />
		</Button>
	);
}

function WelcomeTab() {
	const [version, setVersion] = useState('...');

	useEffect(() => {
		app.getVersion().then(setVersion);
	}, []);

	return (
		<div className="font-sans m-2 h-full flex flex-col items-center gap-6 justify-center">
			<div className="flex flex-col items-center">
				<Iris className="fill-black w-64" />
				<p className="m-1 text-lg">Welcome to Iris Studio!</p>
			</div>

			<div className="flex flex-col items-center max-w-lg w-full gap-2">
				<WelcomeButton
					className="bg-zinc-200 data-[hovered]:bg-zinc-300 data-[pressed]:bg-zinc-400"
					onPress={() => {
						window.open(
							'https://iris.csedu.cs.ucsb.edu/page/iris-author-manual'
						);
					}}
				>
					View the documentation
				</WelcomeButton>
			</div>

			<span className="text-lg text-sm text-gray-700">v{version}</span>
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

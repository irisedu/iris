import { useState, useEffect } from 'react';
import {
	cmdOrCtrl,
	Tabs,
	TabsContext,
	TabList,
	TabPanel,
	Tab,
	type Key
} from 'iris-components';
import { undo, redo } from 'prosemirror-history';
import { CommandButton } from './components';

import HomeMenu from './HomeMenu';
import FormatMenu from './FormatMenu';
import InsertMenu from './InsertMenu';
import TableMenu from './TableMenu';
import FigureMenu from './FigureMenu';

import Undo from '~icons/tabler/arrow-back-up';
import Redo from '~icons/tabler/arrow-forward-up';

interface TabData {
	id: string;
	name: string;
}

const tabs: TabData[] = [
	{ id: 'home', name: 'Home' },
	{ id: 'format', name: 'Format' },
	{ id: 'insert', name: 'Insert' },
	{ id: 'table', name: 'Table' },
	{ id: 'figure', name: 'Figure' }
];

const digits: Record<string, number> = {
	Digit1: 0,
	Digit2: 1,
	Digit3: 2,
	Digit4: 3,
	Digit5: 4
};

export function MenuBar() {
	const [currentTab, setCurrentTab] = useState<Key | undefined>();

	useEffect(() => {
		function onKeyDown(e: KeyboardEvent) {
			if (!cmdOrCtrl(e) || e.repeat) return;

			const digit = digits[e.code];
			if (digit === undefined) return;

			const tab = tabs[digit];
			if (tab) setCurrentTab(tab.id);
		}

		document.addEventListener('keydown', onKeyDown);

		return () => document.removeEventListener('keydown', onKeyDown);
	}, []);

	return (
		<TabsContext.Provider
			value={{ selectedKey: currentTab, onSelectionChange: setCurrentTab }}
		>
			<Tabs className="ribbon-tabs ribbon-tabs--bottom flex flex-col">
				<div className="flex flex-row items-center gap-6 p-2 overflow-auto no-scrollbar border-b-2 border-iris-200">
					<div className="flex flex-row gap-2">
						<CommandButton
							Icon={Undo}
							command={undo}
							tooltip="Undo"
							keys={['Mod', 'Z']}
							alwaysEnabled
						/>
						<CommandButton
							Icon={Redo}
							command={redo}
							tooltip="Redo"
							keys={['Mod', 'Y']}
							alwaysEnabled
						/>
					</div>

					<TabPanel
						id="home"
						className="react-aria-TabPanel flex flex-row gap-6"
						shouldForceMount
					>
						<HomeMenu />
					</TabPanel>

					<TabPanel
						id="format"
						className="react-aria-TabPanel flex flex-row gap-6"
						shouldForceMount
					>
						<FormatMenu />
					</TabPanel>

					<TabPanel
						id="insert"
						className="react-aria-TabPanel flex flex-row gap-6"
						shouldForceMount
					>
						<InsertMenu setCurrentTab={setCurrentTab} />
					</TabPanel>

					<TabPanel
						id="table"
						className="react-aria-TabPanel flex flex-row gap-6"
						shouldForceMount
					>
						<TableMenu />
					</TabPanel>

					<TabPanel
						id="figure"
						className="react-aria-TabPanel flex flex-row gap-6"
						shouldForceMount
					>
						<FigureMenu />
					</TabPanel>
				</div>

				<TabList>
					{tabs.map((tab) => (
						<Tab id={tab.id} key={tab.id}>
							{tab.name}
						</Tab>
					))}
				</TabList>
			</Tabs>
		</TabsContext.Provider>
	);
}

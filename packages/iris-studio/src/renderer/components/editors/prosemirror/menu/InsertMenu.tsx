import { docSchema } from '../schema';
import { addTable, insertNode } from '../commands';
import { CommandButton } from './components';
import {
	useVisibilityParent,
	VisibilityContext,
	VisibilityGroup
} from '$components/VisibilityContext';

import Space from '~icons/tabler/space';
import Table from '~icons/tabler/table-plus';

function InsertMenu({
	index,
	setCurrentTab
}: {
	index: number;
	setCurrentTab: (tab: string) => void;
}) {
	const { childVisibility, setChildVisibility } = useVisibilityParent(index);

	let groupIdx = 0;
	let mainIdx = 0;

	return (
		<VisibilityContext.Provider value={{ childVisibility, setChildVisibility }}>
			<VisibilityGroup index={groupIdx++} className="flex flex-row gap-2">
				<CommandButton
					index={mainIdx++}
					Icon={() => <span className="text-iris-500 text-xl">—</span>}
					command={insertNode(docSchema.nodes.horizontal_rule)}
					tooltip="Horizontal Rule"
				/>
				<CommandButton
					index={mainIdx++}
					Icon={Space}
					command={insertNode(docSchema.nodes.nbsp)}
					tooltip="Non-breaking Space"
					keys={['Mod', 'Space']}
				/>
				<CommandButton
					index={mainIdx++}
					Icon={Table}
					command={(state, dispatch) => {
						if (dispatch) setTimeout(() => setCurrentTab('table'), 80);

						return addTable({
							rowsCount: 2,
							colsCount: 2,
							withHeaderRow: true
						})(state, dispatch);
					}}
					tooltip="Table"
				/>
			</VisibilityGroup>
		</VisibilityContext.Provider>
	);
}

export default InsertMenu;

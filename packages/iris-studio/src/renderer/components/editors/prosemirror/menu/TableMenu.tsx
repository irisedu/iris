import type { EditorView } from 'prosemirror-view';
import {
	addColumnBefore,
	addColumnAfter,
	deleteColumn,
	addRowBefore,
	addRowAfter,
	deleteRow,
	mergeCells,
	splitCell,
	toggleHeaderRow,
	toggleHeaderColumn,
	toggleHeaderCell,
	setCellAttr,
	deleteTable
} from 'prosemirror-tables';
import { CommandButton } from './components';
import {
	useVisibilityParent,
	VisibilityContext,
	VisibilityGroup
} from '$components/VisibilityContext';

import ColumnBefore from '~icons/tabler/column-insert-left';
import ColumnAfter from '~icons/tabler/column-insert-right';
import DeleteColumn from '~icons/tabler/column-remove';
import RowBefore from '~icons/tabler/row-insert-top';
import RowAfter from '~icons/tabler/row-insert-bottom';
import DeleteRow from '~icons/tabler/row-remove';
import Merge from '~icons/tabler/arrow-merge';
import Split from '~icons/tabler/arrows-split';
import HeaderRow from '~icons/tabler/table-row';
import HeaderColumn from '~icons/tabler/table-column';
import HeaderCell from '~icons/tabler/squares-selected';
import AlignLeft from '~icons/tabler/align-left';
import AlignCenter from '~icons/tabler/align-center';
import AlignRight from '~icons/tabler/align-right';
import DeleteTable from '~icons/tabler/table-minus';

function justifyVisible(view: EditorView) {
	return setCellAttr('justify', '???')(view.state, undefined, view);
}

function TableMenu({ index }: { index: number }) {
	const { childVisibility, setChildVisibility } = useVisibilityParent(index);

	let groupIdx = 0;
	let colIdx = 0;
	let rowIdx = 0;
	let cellIdx = 0;
	let headerIdx = 0;
	let justifyIdx = 0;
	let lastIdx = 0;

	return (
		<VisibilityContext.Provider value={{ childVisibility, setChildVisibility }}>
			<VisibilityGroup index={groupIdx++} className="flex flex-row gap-2">
				<CommandButton
					index={colIdx++}
					Icon={ColumnBefore}
					command={addColumnBefore}
					tooltip="Add Column Before"
				/>
				<CommandButton
					index={colIdx++}
					Icon={ColumnAfter}
					command={addColumnAfter}
					tooltip="Add Column After"
				/>
				<CommandButton
					index={colIdx++}
					Icon={DeleteColumn}
					command={deleteColumn}
					tooltip="Delete Column"
				/>
			</VisibilityGroup>

			<VisibilityGroup index={groupIdx++} className="flex flex-row gap-2">
				<CommandButton
					index={rowIdx++}
					Icon={RowBefore}
					command={addRowBefore}
					tooltip="Add Row Before"
				/>
				<CommandButton
					index={rowIdx++}
					Icon={RowAfter}
					command={addRowAfter}
					tooltip="Add Row After"
				/>
				<CommandButton
					index={rowIdx++}
					Icon={DeleteRow}
					command={deleteRow}
					tooltip="Delete Row"
				/>
			</VisibilityGroup>

			<VisibilityGroup index={groupIdx++} className="flex flex-row gap-2">
				<CommandButton
					index={cellIdx++}
					Icon={Merge}
					command={mergeCells}
					tooltip="Merge Cells"
				/>
				<CommandButton
					index={cellIdx++}
					Icon={Split}
					command={splitCell}
					tooltip="Split Cell"
				/>
			</VisibilityGroup>

			<VisibilityGroup index={groupIdx++} className="flex flex-row gap-2">
				<CommandButton
					index={headerIdx++}
					Icon={HeaderRow}
					command={toggleHeaderRow}
					tooltip="Toggle Header Row"
				/>
				<CommandButton
					index={headerIdx++}
					Icon={HeaderColumn}
					command={toggleHeaderColumn}
					tooltip="Toggle Header Column"
				/>
				<CommandButton
					index={headerIdx++}
					Icon={HeaderCell}
					command={toggleHeaderCell}
					tooltip="Toggle Header Cell"
				/>
			</VisibilityGroup>

			<VisibilityGroup index={groupIdx++} className="flex flex-row gap-2">
				<CommandButton
					index={justifyIdx++}
					Icon={AlignLeft}
					command={setCellAttr('justify', 'left')}
					tooltip="Justify Left"
					isVisible={justifyVisible}
				/>
				<CommandButton
					index={justifyIdx++}
					Icon={AlignCenter}
					command={setCellAttr('justify', 'center')}
					tooltip="Justify Center"
					isVisible={justifyVisible}
				/>
				<CommandButton
					index={justifyIdx++}
					Icon={AlignRight}
					command={setCellAttr('justify', 'right')}
					tooltip="Justify Right"
					isVisible={justifyVisible}
				/>
			</VisibilityGroup>

			<VisibilityGroup index={groupIdx++} className="flex flex-row gap-2">
				<CommandButton
					index={lastIdx++}
					Icon={DeleteTable}
					command={deleteTable}
					tooltip="Delete"
				/>
			</VisibilityGroup>
		</VisibilityContext.Provider>
	);
}

export default TableMenu;

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

function TableMenu() {
	return (
		<>
			<div className="flex flex-row gap-2">
				<CommandButton
					Icon={ColumnBefore}
					command={addColumnBefore}
					tooltip="Add Column Before"
				/>
				<CommandButton
					Icon={ColumnAfter}
					command={addColumnAfter}
					tooltip="Add Column After"
				/>
				<CommandButton
					Icon={DeleteColumn}
					command={deleteColumn}
					tooltip="Delete Column"
				/>
			</div>

			<div className="flex flex-row gap-2">
				<CommandButton
					Icon={RowBefore}
					command={addRowBefore}
					tooltip="Add Row Before"
				/>
				<CommandButton
					Icon={RowAfter}
					command={addRowAfter}
					tooltip="Add Row After"
				/>
				<CommandButton
					Icon={DeleteRow}
					command={deleteRow}
					tooltip="Delete Row"
				/>
			</div>

			<div className="flex flex-row gap-2">
				<CommandButton
					Icon={Merge}
					command={mergeCells}
					tooltip="Merge Cells"
				/>
				<CommandButton Icon={Split} command={splitCell} tooltip="Split Cell" />
			</div>

			<div className="flex flex-row gap-2">
				<CommandButton
					Icon={HeaderRow}
					command={toggleHeaderRow}
					tooltip="Toggle Header Row"
				/>
				<CommandButton
					Icon={HeaderColumn}
					command={toggleHeaderColumn}
					tooltip="Toggle Header Column"
				/>
				<CommandButton
					Icon={HeaderCell}
					command={toggleHeaderCell}
					tooltip="Toggle Header Cell"
				/>
			</div>

			<div className="flex flex-row gap-2">
				<CommandButton
					Icon={AlignLeft}
					command={setCellAttr('justify', 'left')}
					tooltip="Justify Left"
					isEnabled={justifyVisible}
				/>
				<CommandButton
					Icon={AlignCenter}
					command={setCellAttr('justify', 'center')}
					tooltip="Justify Center"
					isEnabled={justifyVisible}
				/>
				<CommandButton
					Icon={AlignRight}
					command={setCellAttr('justify', 'right')}
					tooltip="Justify Right"
					isEnabled={justifyVisible}
				/>
			</div>

			<div className="flex flex-row gap-2">
				<CommandButton
					Icon={DeleteTable}
					command={deleteTable}
					tooltip="Delete"
				/>
			</div>
		</>
	);
}

export default TableMenu;

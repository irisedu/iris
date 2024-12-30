import {
	TextSelection,
	type Command,
	type EditorState
} from 'prosemirror-state';
import type { ProseMirrorComponent } from '../';
import {
	tableNodes,
	tableEditing,
	columnResizing,
	tableNodeTypes
} from 'prosemirror-tables';

// https://github.com/ProseMirror/prosemirror-tables/issues/91#issuecomment-794837907
function createTable(
	state: EditorState,
	rowsCount: number,
	colsCount: number,
	withHeaderRow: boolean
) {
	const types = tableNodeTypes(state.schema);
	const headerCells = [];
	const cells = [];

	for (let i = 0; i < colsCount; i++) {
		const cell = types.cell.createAndFill();

		if (cell) {
			cells.push(cell);
		}

		if (withHeaderRow) {
			const headerCell = types.header_cell.createAndFill();

			if (headerCell) {
				headerCells.push(headerCell);
			}
		}
	}

	const rows = [];

	for (let i = 0; i < rowsCount; i++) {
		rows.push(
			types.row.createChecked(
				null,
				withHeaderRow && i === 0 ? headerCells : cells
			)
		);
	}

	return types.table.createChecked(null, rows);
}

function addTable({
	rowsCount,
	colsCount,
	withHeaderRow
}: {
	rowsCount: number;
	colsCount: number;
	withHeaderRow: boolean;
}): Command {
	return (state, dispatch) => {
		const { anchor } = state.selection;

		if (dispatch) {
			const nodes = createTable(state, rowsCount, colsCount, withHeaderRow);
			const tr = state.tr.replaceSelectionWith(nodes).scrollIntoView();
			const resolvedPos = tr.doc.resolve(anchor + 1);

			tr.setSelection(TextSelection.near(resolvedPos));

			dispatch(tr);
		}

		return true;
	};
}

export const tableComponent = {
	plugins: [columnResizing(), tableEditing()],
	nodes: {
		...tableNodes({
			tableGroup: 'block',
			cellContent: 'block+',
			cellAttributes: {
				justify: {
					default: 'left',
					getFromDOM(dom) {
						return dom.style.getPropertyValue('text-align');
					},
					setDOMAttr(value, attrs) {
						if (value)
							attrs.style = (attrs.style || '') + `text-align: ${value};`;
					}
				}
			}
		})
	},
	commands: {
		addTable
	}
} satisfies ProseMirrorComponent;

import type { NodeType, MarkType, Attrs } from 'prosemirror-model';
import { toggleMark } from 'prosemirror-commands';
import { tableNodeTypes } from 'prosemirror-tables';
import {
	Selection,
	TextSelection,
	type Command,
	type EditorState
} from 'prosemirror-state';

export function markActive(state: EditorState, markType: MarkType) {
	// https://github.com/ProseMirror/prosemirror-example-setup/blob/43c1d95fb8669a86c3869338da00dd6bd974197d/src/menu.ts#L58-L62
	const { from, $from, to, empty } = state.selection;
	if (empty) return !!markType.isInSet(state.storedMarks || $from.marks());

	return state.doc.rangeHasMark(from, to, markType);
}

export function insertNode(nodeType: NodeType): Command {
	return (state, dispatch) => {
		const node = nodeType.createAndFill();
		if (!node) return false;

		if (dispatch) {
			dispatch(state.tr.replaceSelectionWith(node).scrollIntoView());
		}

		return true;
	};
}

export function replaceNode(nodeType: NodeType, attrs?: Attrs): Command {
	return (state, dispatch) => {
		const { $from } = state.selection;
		const from = $from.before();
		const to = $from.after();

		if (dispatch) {
			const node = nodeType.createAndFill(attrs);

			if (node) {
				const tr = state.tr.replaceWith(from, to, node);
				dispatch(tr.setSelection(TextSelection.near(tr.doc.resolve(from))));
			}
		}

		return true;
	};
}

export const clearFormatting: Command = (state, dispatch) => {
	if (dispatch) {
		const { from, to } = state.selection;

		dispatch(
			state.tr
				.removeMark(from, to)
				.setBlockType(from, to, state.schema.nodes.paragraph)
				.setStoredMarks([])
				.scrollIntoView()
		);
	}

	return true;
};

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

export function addTable({
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

export function getSidenote(state: EditorState) {
	const sidenote = state.schema.nodes.sidenote;
	const { $from } = state.selection;

	for (let i = 0; i <= $from.depth; i++) {
		if ($from.node(i).type === sidenote) return $from.start(i);
	}

	return null;
}

export const insertSidenote: Command = (state, dispatch) => {
	const sidenote = state.schema.nodes.sidenote;
	const { anchor } = state.selection;

	if (getSidenote(state)) return false;

	if (dispatch) {
		const node = sidenote.createAndFill({}, state.selection.content().content);

		if (node) {
			const tr = state.tr.replaceSelectionWith(node);

			tr.setSelection(TextSelection.near(tr.doc.resolve(anchor + 2)));
			dispatch(tr);
		}
	}

	return true;
};

export function setSidenoteNumbering(numbered: boolean): Command {
	return (state, dispatch) => {
		const sidenotePos = getSidenote(state);
		if (!sidenotePos) return false;

		if (dispatch) {
			dispatch(
				state.tr.setNodeAttribute(sidenotePos - 1, 'numbered', numbered)
			);
		}

		return true;
	};
}

export const toggleLink: Command = (state, dispatch) => {
	const link = state.schema.marks.link;
	const { from, to, empty } = state.selection;

	if (!toggleMark(link)(state)) return false;

	if (markActive(state, link)) {
		if (!dispatch) return true;

		// Clear mark from all links in range
		const tr = state.tr;

		state.doc.nodesBetween(from, to, (node, pos) => {
			if (link.isInSet(node.marks)) tr.removeMark(pos, pos + node.nodeSize);
		});

		dispatch(tr);
	} else {
		if (empty) return false;

		// Add link across entire range
		if (dispatch) dispatch(state.tr.addMark(from, to, link.create()));
	}

	return true;
};

export const toggleSummaryHeading: Command = (state, dispatch) => {
	const { summary, summary_page, summary_heading, summary_list } =
		state.schema.nodes;
	const { $head } = state.selection;

	let targetType: NodeType;
	if ($head.parent.type === summary_heading) {
		targetType = summary_list;
	} else if ($head.parent.type === summary_page) {
		targetType = summary_heading;
	} else {
		return false;
	}

	let targetDepth: number | undefined;

	for (let depth = $head.depth; depth >= 0; depth--) {
		if ($head.node(depth).type === summary) {
			targetDepth = depth + 1;
			break;
		}
	}

	if (!targetDepth) return false;
	const after = $head.after(targetDepth);

	if (state.doc.nodeAt(after)?.type === targetType) {
		if (dispatch) {
			dispatch(state.tr.setSelection(Selection.near(state.doc.resolve(after))));
		}

		return true;
	}

	if (dispatch) {
		const node = targetType.createAndFill();

		if (node) {
			const tr = state.tr.replaceWith(after, after, node).scrollIntoView();

			tr.setSelection(Selection.near(tr.doc.resolve(after)));
			dispatch(tr);
		}
	}

	return true;
};

export const exitSummary: Command = (state, dispatch) => {
	const { summary, paragraph } = state.schema.nodes;
	const { $head, empty } = state.selection;
	if (!empty) return false;

	let pos: number | undefined;

	for (let depth = $head.depth; depth >= 0; depth--) {
		if ($head.node(depth).type === summary) {
			pos = $head.after(depth);
			break;
		}
	}

	if (!pos) return false;

	if (dispatch) {
		const tr = state.tr
			.replaceWith(pos, pos, paragraph.create())
			.scrollIntoView();

		tr.setSelection(Selection.near(tr.doc.resolve(pos)));

		dispatch(tr);
	}

	return true;
};

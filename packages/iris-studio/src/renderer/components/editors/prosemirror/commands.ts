import type {
	Node,
	NodeType,
	MarkType,
	Attrs,
	ResolvedPos,
	Fragment
} from 'prosemirror-model';
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

// https://discuss.prosemirror.net/t/find-extents-of-a-mark-given-a-selection/344/2
// TODO: Check attributes?
export function markExtend(
	$start: ResolvedPos,
	$end: ResolvedPos,
	mark: MarkType
) {
	let startIndex = $start.index();
	let endIndex = $end.indexAfter();

	if (
		startIndex === endIndex ||
		startIndex >= $start.parent.childCount ||
		endIndex > $start.parent.childCount
	)
		return null;

	for (let i = startIndex; i < endIndex; i++) {
		if (!mark.isInSet($start.parent.child(i).marks)) return null;
	}

	while (
		startIndex > 0 &&
		mark.isInSet($start.parent.child(startIndex - 1).marks)
	) {
		startIndex--;
	}

	while (
		endIndex < $start.parent.childCount &&
		mark.isInSet($start.parent.child(endIndex).marks)
	) {
		endIndex++;
	}

	let startPos = $start.start();
	let endPos = startPos;
	for (let i = 0; i < endIndex; i++) {
		const size = $start.parent.child(i).nodeSize;
		if (i < startIndex) startPos += size;
		endPos += size;
	}

	const firstMark = $start.parent
		.child(startIndex)
		.marks.find((m) => m.type === mark);
	if (!firstMark) return null;

	return {
		from: startPos,
		to: endPos,
		mark: firstMark
	};
}

export function insertNode(
	nodeType: NodeType,
	content?: () => Fragment | Node | readonly Node[]
): Command {
	return (state, dispatch) => {
		const node = content
			? nodeType.create(null, content())
			: nodeType.createAndFill();

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

export function findParent(state: EditorState, nodeTypes: NodeType[]) {
	const { $head } = state.selection;

	for (let depth = $head.depth; depth >= 0; depth--) {
		if (nodeTypes.includes($head.node(depth).type)) {
			return { before: $head.before(depth), after: $head.after(depth) };
		}
	}
}

export function exitNode(nodeTypes: NodeType[]): Command {
	return (state, dispatch) => {
		const { paragraph } = state.schema.nodes;
		const { empty } = state.selection;
		if (!empty) return false;

		const pos = findParent(state, nodeTypes);
		if (!pos) return false;

		if (dispatch) {
			const tr = state.tr
				.replaceWith(pos.after, pos.after, paragraph.create())
				.scrollIntoView();

			tr.setSelection(Selection.near(tr.doc.resolve(pos.after)));

			dispatch(tr);
		}

		return true;
	};
}

export function setParentAttr(
	nodeType: NodeType,
	attr: string,
	value: unknown
): Command {
	return (state, dispatch) => {
		const pos = findParent(state, [nodeType]);
		if (!pos) return false;

		if (dispatch) {
			dispatch(state.tr.setNodeAttribute(pos.before, attr, value));
		}

		return true;
	};
}

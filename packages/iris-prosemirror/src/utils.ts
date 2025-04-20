import type {
	Node,
	NodeType,
	MarkType,
	ResolvedPos,
	Fragment,
	Attrs
} from 'prosemirror-model';
import { Selection, type Command, type EditorState } from 'prosemirror-state';

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
	content?: () => Fragment | Node | readonly Node[],
	attrs?: Attrs | (() => Attrs)
): Command {
	return (state, dispatch) => {
		const realAttrs = typeof attrs === 'function' ? attrs() : attrs;
		const node = content
			? nodeType.create(realAttrs, content())
			: nodeType.createAndFill(realAttrs);

		if (!node) return false;

		if (dispatch) {
			dispatch(state.tr.replaceSelectionWith(node).scrollIntoView());
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

export function findParent(state: EditorState, nodeTypes: NodeType[]) {
	const { $head } = state.selection;

	for (let depth = $head.depth; depth >= 0; depth--) {
		if (nodeTypes.includes($head.node(depth).type)) {
			return {
				before: $head.before(depth),
				after: $head.after(depth),
				index: $head.index(depth)
			};
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

export function deleteBlock(nodeTypes: NodeType[]): Command {
	return (state, dispatch) => {
		const { $head, empty } = state.selection;
		if (!empty || $head.parent.childCount) return false;

		const pos = findParent(state, nodeTypes);
		if (!pos || pos.index !== 0) return false;

		if (dispatch) {
			const tr = state.tr.delete(pos.before, pos.after);
			tr.setSelection(
				Selection.near(tr.doc.resolve(Math.max(pos.before - 1, 0)))
			);

			dispatch(tr);
		}

		return true;
	};
}

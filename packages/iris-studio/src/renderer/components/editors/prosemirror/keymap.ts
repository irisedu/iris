import type { Schema } from 'prosemirror-model';
import { undo, redo } from 'prosemirror-history';
import { undoInputRule } from 'prosemirror-inputrules';
import {
	splitListItem,
	liftListItem,
	sinkListItem
} from 'prosemirror-schema-list';
import {
	chainCommands,
	newlineInCode,
	createParagraphNear,
	liftEmptyBlock,
	splitBlock,
	deleteSelection,
	joinTextblockBackward,
	joinTextblockForward,
	joinBackward,
	joinForward,
	selectNodeBackward,
	selectNodeForward,
	selectAll,
	exitCode,
	toggleMark
} from 'prosemirror-commands';
import { goToNextCell } from 'prosemirror-tables';

import { baseSchema, docSchema } from './schema';
import { insertNode, clearFormatting, toggleLink } from './commands';
import { toggleInlineMath, insertDisplayMath } from './katex';

function schemaCommonKeymap(schema: Schema) {
	return {
		Enter: chainCommands(
			newlineInCode,
			splitListItem(schema.nodes.list_item),
			createParagraphNear,
			liftEmptyBlock,
			splitBlock
		),
		'Shift-Enter': chainCommands(
			newlineInCode,
			createParagraphNear,
			liftEmptyBlock,
			splitBlock
		),

		'Mod-Space': insertNode(schema.nodes.nbsp),
		'Mod-Enter': chainCommands(exitCode, insertNode(schema.nodes.hard_break)),

		'Mod-i': toggleMark(schema.marks.em),
		'Mod-b': toggleMark(schema.marks.strong),
		'Mod-u': toggleMark(schema.marks.u),
		'Mod-,': toggleMark(schema.marks.sub),
		'Mod-.': toggleMark(schema.marks.sup),
		'Alt-Shift-5': toggleMark(schema.marks.s),

		'Mod-`': toggleMark(schema.marks.code),

		'Mod-[': liftListItem(schema.nodes.list_item),
		'Mod-]': sinkListItem(schema.nodes.list_item),

		'Alt-Space': toggleInlineMath,
		'Alt-Shift-Space': insertDisplayMath
	};
}

// https://github.com/ProseMirror/prosemirror-commands/blob/master/src/commands.ts
export const baseKeymap = {
	Backspace: chainCommands(
		deleteSelection,
		joinTextblockBackward,
		joinBackward,
		selectNodeBackward
	),
	Delete: chainCommands(
		deleteSelection,
		joinTextblockForward,
		joinForward,
		selectNodeForward
	),
	'Mod-z': chainCommands(undoInputRule, undo),
	'Mod-y': redo,
	'Mod-Shift-z': redo,
	'Mod-\\': clearFormatting,
	'Mod-a': selectAll,

	'Mod-k': toggleLink,

	'Shift-Tab': goToNextCell(-1),
	Tab: goToNextCell(1),

	...schemaCommonKeymap(baseSchema)
};

export const docKeymap = {
	...baseKeymap,
	...schemaCommonKeymap(docSchema)
};

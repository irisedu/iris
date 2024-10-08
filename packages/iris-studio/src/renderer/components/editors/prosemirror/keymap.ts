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
import {
	insertNode,
	clearFormatting,
	toggleLink,
	exitNode,
	toggleSummaryHeading
} from './commands';
import { toggleInlineMath, insertDisplayMath } from './katex';

function schemaCommonKeymap(schema: Schema) {
	return {
		'Ctrl-Space': insertNode(schema.nodes.nbsp),

		'Mod-i': toggleMark(schema.marks.italic),
		'Mod-b': toggleMark(schema.marks.bold),
		'Mod-u': toggleMark(schema.marks.underline),
		'Mod-,': toggleMark(schema.marks.subscript),
		'Mod-.': toggleMark(schema.marks.superscript),
		'Alt-Shift-5': toggleMark(schema.marks.strikethrough),

		'Mod-`': toggleMark(schema.marks.code),

		'Alt-m': toggleInlineMath,
		'Alt-Shift-m': insertDisplayMath
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

	// Common with variations
	Enter: chainCommands(
		newlineInCode,
		splitListItem(baseSchema.nodes.list_item),
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
	'Mod-Enter': chainCommands(
		exitCode,
		exitNode([baseSchema.nodes.figure]),
		insertNode(baseSchema.nodes.hard_break)
	),

	'Mod-[': liftListItem(baseSchema.nodes.list_item),
	'Mod-]': sinkListItem(baseSchema.nodes.list_item),

	...schemaCommonKeymap(baseSchema)
};

export const docKeymap = {
	...baseKeymap,

	// Common with variations
	Enter: chainCommands(
		newlineInCode,
		splitListItem(docSchema.nodes.list_item),
		splitListItem(docSchema.nodes.summary_list_item),
		createParagraphNear,
		liftEmptyBlock,
		splitBlock
	),
	'Shift-Enter': chainCommands(
		toggleSummaryHeading,
		newlineInCode,
		createParagraphNear,
		liftEmptyBlock,
		splitBlock
	),
	'Mod-Enter': chainCommands(
		exitCode,
		exitNode([docSchema.nodes.summary, docSchema.nodes.figure]),
		insertNode(docSchema.nodes.hard_break)
	),

	'Mod-[': chainCommands(
		liftListItem(docSchema.nodes.list_item),
		liftListItem(docSchema.nodes.summary_list_item)
	),
	'Mod-]': chainCommands(
		sinkListItem(docSchema.nodes.list_item),
		sinkListItem(docSchema.nodes.summary_list_item)
	),

	...schemaCommonKeymap(docSchema)
};

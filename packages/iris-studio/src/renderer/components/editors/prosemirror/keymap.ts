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
	exitSummary,
	toggleSummaryHeading
} from './commands';
import { toggleInlineMath, insertDisplayMath } from './katex';

function schemaCommonKeymap(schema: Schema) {
	return {
		'Mod-Space': insertNode(schema.nodes.nbsp),

		'Mod-i': toggleMark(schema.marks.em),
		'Mod-b': toggleMark(schema.marks.strong),
		'Mod-u': toggleMark(schema.marks.u),
		'Mod-,': toggleMark(schema.marks.sub),
		'Mod-.': toggleMark(schema.marks.sup),
		'Alt-Shift-5': toggleMark(schema.marks.s),

		'Mod-`': toggleMark(schema.marks.code),

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
	'Mod-Enter': chainCommands(exitCode, insertNode(baseSchema.nodes.hard_break)),

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
		exitSummary,
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

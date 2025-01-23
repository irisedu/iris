import { Schema, type NodeSpec, type MarkSpec } from 'prosemirror-model';
import { goToNextCell } from 'prosemirror-tables';
import {
	type InputRule,
	inputRules,
	textblockTypeInputRule
} from 'prosemirror-inputrules';
import { history, undo, redo } from 'prosemirror-history';
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
import { keymap } from 'prosemirror-keymap';
import { gapCursor } from 'prosemirror-gapcursor';
import { dropCursor } from 'prosemirror-dropcursor';
import type { NodeViewConstructor } from 'prosemirror-view';
import {
	react,
	type ReactNodeViewConstructor
} from '@nytimes/react-prosemirror';
import { insertNode, clearFormatting, exitNode, deleteBlock } from './utils';
import {
	blockQuoteComponent,
	codeComponent,
	figureComponent,
	frontmatterComponent,
	linkComponent,
	listsComponent,
	mathComponent,
	noteComponent,
	sidenoteComponent,
	smartypantsComponent,
	spacesComponent,
	summaryComponent,
	tableComponent
} from './components';
import { type Command } from 'prosemirror-state';
import { questionComponent } from './components/question';

const { toggleInlineMath, insertDisplayMath } = mathComponent.commands;

////////////
// SCHEMA //
////////////

// Some portions from https://github.com/ProseMirror/prosemirror-schema-basic/blob/master/src/schema-basic.ts
// Copyright (C) 2015-2017 by Marijn Haverbeke <marijn@haverbeke.berlin> and others (MIT)
export const baseSchemaDef = {
	nodes: {
		doc: { content: '(block | heading)+' } as NodeSpec,
		text: { group: 'inline' } as NodeSpec,

		paragraph: {
			group: 'block',
			content: '(inline | sidenote)*',
			toDOM() {
				return ['p', 0];
			},
			parseDOM: [{ tag: 'p' }, { tag: 'h5' }, { tag: 'h6' }]
		} as NodeSpec,
		...spacesComponent.nodes,
		heading: {
			content: '(inline | sidenote)*',
			attrs: { level: { default: 2, validate: 'number' } },
			defining: true,
			toDOM(node) {
				return ['h' + node.attrs.level, 0];
			},
			parseDOM: [
				{ tag: 'h1', attrs: { level: 2 } },
				{ tag: 'h2', attrs: { level: 2 } },
				{ tag: 'h3', attrs: { level: 3 } },
				{ tag: 'h4', attrs: { level: 4 } }
			]
		} as NodeSpec,

		...blockQuoteComponent.nodes,
		...noteComponent.nodes,
		...sidenoteComponent.nodes,
		...listsComponent.nodes,
		...tableComponent.nodes,
		...mathComponent.nodes,
		...codeComponent.nodes,
		...figureComponent.nodes
	},
	marks: {
		// Keep as first to render as parent of all other marks
		...linkComponent.marks,

		italic: {
			toDOM() {
				return ['em', 0];
			},
			parseDOM: [
				{ tag: 'i' },
				{ tag: 'em' },
				{ style: 'font-style=italic' },
				{ style: 'font-style=normal', clearMark: (m) => m.type.name == 'em' }
			]
		} as MarkSpec,
		bold: {
			toDOM() {
				return ['strong', 0];
			},
			parseDOM: [
				{ tag: 'strong' },
				// This works around a Google Docs misbehavior where
				// pasted content will be inexplicably wrapped in `<b>`
				// tags with a font-weight normal.
				{
					tag: 'b',
					getAttrs: (node) => node.style.fontWeight != 'normal' && null
				},
				{ style: 'font-weight=400', clearMark: (m) => m.type.name == 'strong' },
				{
					style: 'font-weight',
					getAttrs: (value) => /^(bold(er)?|[5-9]\d{2,})$/.test(value) && null
				}
			]
		} as MarkSpec,
		underline: {
			toDOM() {
				return ['u', 0];
			},
			parseDOM: [{ tag: 'u' }, { style: 'text-decoration=underline' }]
		} as MarkSpec,
		strikethrough: {
			toDOM() {
				return ['s', 0];
			},
			parseDOM: [{ tag: 's' }, { style: 'text-decoration=line-through' }]
		} as MarkSpec,
		superscript: {
			excludes: 'subscript',
			toDOM() {
				return ['sup', 0];
			},
			parseDOM: [{ tag: 'sup' }]
		} as MarkSpec,
		subscript: {
			excludes: 'superscript',
			toDOM() {
				return ['sub', 0];
			},
			parseDOM: [{ tag: 'sub' }]
		} as MarkSpec,
		small_caps: {
			toDOM() {
				return ['span', { class: 'font-smallcaps' }, 0];
			},
			parseDOM: [
				{ style: 'font-variant=small-caps' },
				{ style: 'font-variant-caps=small-caps' }
			]
		} as MarkSpec,

		code: {
			toDOM() {
				return ['code', 0];
			},
			parseDOM: [{ tag: 'code' }]
		} as MarkSpec,

		...mathComponent.marks
	}
};

const docSchemaDef = {
	nodes: {
		...baseSchemaDef.nodes,
		doc: { content: 'frontmatter (block | heading | summary)+' } as NodeSpec,

		...frontmatterComponent.nodes,
		...summaryComponent.nodes,
		...questionComponent.nodes
	},
	marks: {
		...baseSchemaDef.marks
	}
};

export const baseSchema = new Schema(baseSchemaDef);
export const docSchema = new Schema(docSchemaDef);

/////////////////
// INPUT RULES //
/////////////////

// Some input rules and code from ProseMirror examples
// Copyright (C) 2015-2017 by Marijn Haverbeke <marijn@haverbeke.berlin> and others (MIT)

export function makeBaseInputRules(schema: Schema) {
	return [
		...smartypantsComponent.inputRules(schema),
		...listsComponent.inputRules(schema),
		...codeComponent.inputRules(schema),
		...blockQuoteComponent.inputRules(schema),
		...noteComponent.inputRules(schema),

		// https://github.com/ProseMirror/prosemirror-example-setup/blob/master/src/inputrules.ts
		textblockTypeInputRule(/^(#{2,4})\s$/, schema.nodes.heading, (match) => ({
			level: match[1].length
		}))
	];
}

export const baseRules = makeBaseInputRules(baseSchema);

export const docRules = [...makeBaseInputRules(docSchema)];

////////////
// KEYMAP //
////////////

// https://github.com/ProseMirror/prosemirror-commands/blob/master/src/commands.ts
export function makeCommonKeymap(schema: Schema) {
	return {
		Backspace: chainCommands(
			deleteSelection,
			deleteBlock([schema.nodes.math_display, schema.nodes.note]),
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
		'Mod-Shift-Enter': insertNode(schema.nodes.hard_break),

		'Mod-a': selectAll,
		'Mod-z': chainCommands(undoInputRule, undo),
		'Mod-y': redo,
		'Mod-Shift-z': redo,

		'Ctrl-Space': insertNode(schema.nodes.nbsp),

		'Mod-\\': clearFormatting,

		'Mod-i': toggleMark(schema.marks.italic),
		'Mod-b': toggleMark(schema.marks.bold),
		'Mod-u': toggleMark(schema.marks.underline),
		'Mod-,': toggleMark(schema.marks.subscript),
		'Mod-.': toggleMark(schema.marks.superscript),
		'Alt-Shift-5': toggleMark(schema.marks.strikethrough),
		'Mod-`': toggleMark(schema.marks.code),

		'Mod-k': linkComponent.commands.toggleLink,

		'Alt-m': toggleInlineMath,
		'Alt-Shift-m': insertDisplayMath
	};
}

export function makeBaseKeymap(schema: Schema) {
	return {
		// Common with variations
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
		'Mod-Enter': chainCommands(
			exitCode,
			exitNode([
				schema.nodes.figure,
				schema.nodes.blockquote,
				schema.nodes.note,
				schema.nodes.table
			])
		),

		'Shift-Tab': chainCommands(
			goToNextCell(-1),
			liftListItem(schema.nodes.list_item)
		),
		Tab: chainCommands(goToNextCell(1), sinkListItem(schema.nodes.list_item)),
		'Mod-[': liftListItem(schema.nodes.list_item),
		'Mod-]': sinkListItem(schema.nodes.list_item),

		...makeCommonKeymap(schema)
	};
}

export const baseKeymap = makeBaseKeymap(baseSchema);

export const docKeymap = {
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
		summaryComponent.commands.toggleSummaryHeading,
		newlineInCode,
		createParagraphNear,
		liftEmptyBlock,
		splitBlock
	),
	'Mod-Enter': chainCommands(
		exitCode,
		exitNode([
			docSchema.nodes.summary,
			docSchema.nodes.figure,
			docSchema.nodes.blockquote,
			docSchema.nodes.note,
			docSchema.nodes.table
		])
	),

	'Shift-Tab': chainCommands(
		goToNextCell(-1),
		liftListItem(docSchema.nodes.list_item),
		liftListItem(docSchema.nodes.summary_list_item)
	),
	Tab: chainCommands(
		goToNextCell(1),
		sinkListItem(docSchema.nodes.list_item),
		sinkListItem(docSchema.nodes.summary_list_item)
	),
	'Mod-[': chainCommands(
		liftListItem(docSchema.nodes.list_item),
		liftListItem(docSchema.nodes.summary_list_item)
	),
	'Mod-]': chainCommands(
		sinkListItem(docSchema.nodes.list_item),
		sinkListItem(docSchema.nodes.summary_list_item)
	),

	...makeCommonKeymap(docSchema)
};

/////////////
// PLUGINS //
/////////////

export const commonPlugins = [
	react(),
	history(),
	dropCursor({
		class: 'ProseMirror-dropcursor',
		color: false
	}),
	...mathComponent.plugins,
	gapCursor(),
	...tableComponent.plugins,
	...codeComponent.plugins
];

export function makeBasePlugins(
	keys: Record<string, Command>,
	rules: InputRule[]
) {
	return [...commonPlugins, keymap(keys), inputRules({ rules })];
}

export const basePlugins = makeBasePlugins(baseKeymap, baseRules);

export const docPlugins = [
	...commonPlugins,
	keymap(docKeymap),
	inputRules({ rules: docRules }),
	...summaryComponent.plugins
];

////////////////
// NODE VIEWS //
////////////////

export const baseNodeViews = {
	...codeComponent.nodeViews
} as Record<string, NodeViewConstructor>;

export const docNodeViews = {
	...baseNodeViews
} as Record<string, NodeViewConstructor>;

export const baseReactNodeViews = {} as Record<
	string,
	ReactNodeViewConstructor
>;

export const docReactNodeViews = {
	...baseReactNodeViews,
	...frontmatterComponent.reactNodeViews
} as Record<string, ReactNodeViewConstructor>;

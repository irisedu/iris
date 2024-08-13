import {
	InputRule,
	textblockTypeInputRule,
	wrappingInputRule
} from 'prosemirror-inputrules';
import type { Schema } from 'prosemirror-model';
import type { Transaction } from 'prosemirror-state';
import { baseSchema, docSchema } from './schema';
import { replaceNode } from './commands';

// Some input rules and code from ProseMirror examples
// Copyright (C) 2015-2017 by Marijn Haverbeke <marijn@haverbeke.berlin> and others (MIT)

function smartyPantsRule(regex: RegExp, replacement: string) {
	return new InputRule(regex, (state, match, start, end) => {
		// Disable smartypants rules in inline code/math
		const { $from, empty } = state.selection;
		const disabledMarks = [
			state.schema.marks.code,
			state.schema.marks.math_inline
		];
		if (
			disabledMarks.some(
				(mark) =>
					(empty && mark.isInSet(state.storedMarks || $from.marks())) ||
					state.doc.rangeHasMark(start, end, mark)
			)
		)
			return null;

		// https://github.com/ProseMirror/prosemirror-inputrules/blob/master/src/inputrules.ts
		// stringHandler
		let insert = replacement;
		if (match[1]) {
			const offset = match[0].lastIndexOf(match[1]);
			insert += match[0].slice(offset + match[1].length);
			start += offset;
			const cutOff = start - end;
			if (cutOff > 0) {
				insert = match[0].slice(offset - cutOff, offset) + insert;
				start = end;
			}
		}

		return state.tr.insertText(insert, start, end);
	});
}

// https://github.com/ProseMirror/prosemirror-inputrules/blob/master/src/rules.ts
const smartyPants = [
	smartyPantsRule(/--$/, '–'), // en
	smartyPantsRule(/–-$/, '—'), // em
	smartyPantsRule(/\.\.\.$/, '…'), // ellipsis

	// cycles
	smartyPantsRule(/“"$/, '”'),
	smartyPantsRule(/”"$/, '"'),
	smartyPantsRule(/""$/, '“'),

	smartyPantsRule(/‘'$/, '’'),
	smartyPantsRule(/’'$/, "'"),
	smartyPantsRule(/''$/, '‘'),

	// normal
	smartyPantsRule(/(?:^|[\s{[(<`'"\u2018\u201C])(")$/, '“'), // open double quote
	smartyPantsRule(/"$/, '”'), // close double quote
	smartyPantsRule(/(?:^|[\s{[(<`'"\u2018\u201C])(')$/, '‘'), // open single quote
	smartyPantsRule(/'$/, '’') // close single quote
];

function schemaCommonRules(schema: Schema) {
	return [
		// https://github.com/ProseMirror/prosemirror-example-setup/blob/master/src/inputrules.ts
		textblockTypeInputRule(/^(#{2,4})\s$/, schema.nodes.heading, (match) => ({
			level: match[1].length
		})),

		wrappingInputRule(
			/^(\d+)\.\s$/,
			schema.nodes.ordered_list,
			(match) => ({ order: +match[1] }),
			(match, node) => node.childCount + node.attrs.order == +match[1]
		),
		wrappingInputRule(/^\s*([-+*])\s$/, schema.nodes.bullet_list),

		new InputRule(/^```(\S*)\s+$/, (state, match) => {
			let tr: Transaction | undefined;

			replaceNode(schema.nodes.code_block, { language: match[1] })(
				state,
				(cmdTr) => {
					tr = cmdTr;
				}
			);

			return tr ?? null;
		})
	];
}

const _baseRules = [...smartyPants];

export const baseRules = [..._baseRules, ...schemaCommonRules(baseSchema)];

export const docRules = [..._baseRules, ...schemaCommonRules(docSchema)];

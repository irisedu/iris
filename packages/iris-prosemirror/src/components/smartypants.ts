import type { ProseMirrorComponent } from '../';
import { InputRule } from 'prosemirror-inputrules';

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
		) {
			return null;
		}

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

export const smartypantsComponent = {
	inputRules: (_schema) =>
		// https://github.com/ProseMirror/prosemirror-inputrules/blob/master/src/rules.ts
		[
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
			smartyPantsRule(/'$/, '’'), // close single quote

			// Other symbols
			smartyPantsRule(/->$/, '→'),
			smartyPantsRule(/<-$/, '←'),
			smartyPantsRule(/=>$/, '⇒'),
			smartyPantsRule(/<=$/, '⇐')
		]
} satisfies ProseMirrorComponent;

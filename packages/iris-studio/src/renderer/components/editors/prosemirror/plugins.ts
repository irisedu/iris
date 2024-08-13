import { history } from 'prosemirror-history';
import { keymap } from 'prosemirror-keymap';
import { baseKeymap, docKeymap } from './keymap';
import { inputRules } from 'prosemirror-inputrules';
import { baseRules, docRules } from './inputrules';
import { gapCursor } from 'prosemirror-gapcursor';
import { dropCursor } from 'prosemirror-dropcursor';
import { tableEditing, columnResizing } from 'prosemirror-tables';
import { cmArrowHandlers } from './codemirror';
import { katexPlugin } from './katex';
import { react } from '@nytimes/react-prosemirror';

const _basePlugins = [
	react(),
	history(),
	dropCursor({
		class: 'ProseMirror-dropcursor',
		color: false
	}),
	katexPlugin,
	gapCursor(),
	columnResizing(),
	tableEditing(),
	cmArrowHandlers
];

export const basePlugins = [
	..._basePlugins,
	keymap(baseKeymap),
	inputRules({ rules: baseRules })
];

export const docPlugins = [
	..._basePlugins,
	keymap(docKeymap),
	inputRules({ rules: docRules })
];

import {
	EditorView as CodeMirror,
	keymap as cmKeymap,
	drawSelection,
	type ViewUpdate,
	type KeyBinding
} from '@codemirror/view';
import { defaultKeymap } from '@codemirror/commands';
import { Compartment } from '@codemirror/state';
import { indentOnInput, LanguageDescription } from '@codemirror/language';
import { autocompletion, closeBrackets } from '@codemirror/autocomplete';
import { languages } from '@codemirror/language-data';
import { githubDark, githubLight } from '@uiw/codemirror-theme-github';

import type { Node } from 'prosemirror-model';
import type { EditorView } from 'prosemirror-view';
import { keymap } from 'prosemirror-keymap';
import { Selection, TextSelection, type Command } from 'prosemirror-state';
import { exitCode } from 'prosemirror-commands';
import { undo, redo } from 'prosemirror-history';
import { clearFormatting } from './commands';

// https://github.com/ProseMirror/website/blob/master/example/codemirror/index.js
// https://prosemirror.net/examples/codemirror/
// Copyright (C) 2015-2017 by Marijn Haverbeke <marijn@haverbeke.berlin> and others (MIT)

export class CodeBlockView {
	node: Node;
	view: EditorView;
	getPos: () => number | undefined;

	language: Compartment;
	theme: Compartment;

	cm: CodeMirror;
	updating: boolean;
	dom: HTMLElement;

	observer: MutationObserver;

	constructor(node: Node, view: EditorView, getPos: () => number | undefined) {
		this.node = node;
		this.view = view;
		this.getPos = getPos;

		this.language = new Compartment();
		this.theme = new Compartment();

		this.cm = new CodeMirror({
			doc: this.node.textContent,
			extensions: [
				cmKeymap.of([...this.codeMirrorKeymap(), ...defaultKeymap]),
				drawSelection(),
				indentOnInput(),
				autocompletion(),
				closeBrackets(),
				this.theme.of(githubLight),
				this.language.of([]),
				CodeMirror.updateListener.of((update) => this.forwardUpdate(update))
			]
		});

		// Theme changing
		this.observer = new MutationObserver((mutations) => {
			mutations.forEach((m) => {
				if (
					(m.type !== 'attributes' && m.attributeName !== 'class') ||
					!(m.target instanceof HTMLElement)
				)
					return;
				this.updateTheme(m.target);
			});
		});

		this.updateTheme(document.documentElement);
		this.observer.observe(document.documentElement, { attributes: true });

		// DOM
		const container = document.createElement('div');
		container.className = 'CodeMirror-container';
		container.appendChild(this.cm.dom);

		const label = document.createElement('span');
		label.className = 'CodeMirror-languagelabel';
		label.innerText = node.attrs.language.length
			? node.attrs.language
			: 'plaintext';
		container.appendChild(label);

		this.dom = container;

		this.updateLanguage();

		// Avoid infinite loop
		this.updating = false;
	}

	updateTheme(domElement: HTMLElement) {
		const dark = domElement.classList.contains('dark');
		const theme = dark ? githubDark : githubLight;

		this.cm.dispatch({
			effects: this.theme.reconfigure(theme)
		});
	}

	updateLanguage() {
		const lang = this.node.attrs.language;
		const extension = LanguageDescription.matchLanguageName(languages, lang);

		if (extension) {
			extension.load().then((ext) => {
				this.cm.dispatch({
					effects: this.language.reconfigure(ext)
				});
			});
		}
	}

	forwardUpdate(update: ViewUpdate) {
		if (this.updating || !this.cm.hasFocus) return;

		const { main } = update.state.selection;

		let offset = this.getPos()! + 1;
		const selFrom = offset + main.from;
		const selTo = offset + main.to;

		const pmSel = this.view.state.selection;

		if (update.docChanged || pmSel.from != selFrom || pmSel.to != selTo) {
			const tr = this.view.state.tr;
			update.changes.iterChanges((fromA, toA, fromB, toB, text) => {
				if (text.length) {
					tr.replaceWith(
						offset + fromA,
						offset + toA,
						this.view.state.schema.text(text.toString())
					);
				} else {
					tr.delete(offset + fromA, offset + toA);
				}

				offset += toB - fromB - (toA - fromA);
			});

			tr.setSelection(TextSelection.create(tr.doc, selFrom, selTo));
			this.view.dispatch(tr);
		}
	}

	setSelection(anchor: number, head: number) {
		this.cm.focus();
		this.updating = true;
		this.cm.dispatch({ selection: { anchor, head } });
		this.updating = false;
	}

	codeMirrorKeymap(): KeyBinding[] {
		const view = this.view;

		return [
			{ key: 'ArrowUp', run: () => this.maybeEscape('line', -1) },
			{ key: 'ArrowLeft', run: () => this.maybeEscape('char', -1) },
			{ key: 'ArrowDown', run: () => this.maybeEscape('line', 1) },
			{ key: 'ArrowRight', run: () => this.maybeEscape('char', 1) },
			{
				key: 'Ctrl-Enter',
				run: () => {
					if (!exitCode(view.state, view.dispatch)) return false;
					view.focus();
					return true;
				}
			},
			{
				key: 'Ctrl-z',
				mac: 'Cmd-z',
				run: () => undo(view.state, view.dispatch)
			},
			{
				key: 'Shift-Ctrl-z',
				mac: 'Shift-Cmd-z',
				run: () => redo(view.state, view.dispatch)
			},
			{
				key: 'Ctrl-y',
				mac: 'Cmd-y',
				run: () => redo(view.state, view.dispatch)
			},
			{
				key: 'Ctrl-\\',
				mac: 'Cmd-\\',
				run: () => clearFormatting(view.state, view.dispatch)
			}
		];
	}

	maybeEscape(unit: 'line' | 'char', dir: number) {
		const { state } = this.cm;
		const { main } = state.selection;
		if (!main.empty) return false;

		let from;
		let to;

		if (unit === 'line') {
			const line = state.doc.lineAt(main.head);
			from = line.from;
			to = line.to;
		} else {
			from = main.from;
			to = main.to;
		}

		if (dir < 0 ? from > 0 : to < state.doc.length) return false;

		const targetPos = this.getPos()! + (dir < 0 ? 0 : this.node.nodeSize);
		const selection = Selection.near(
			this.view.state.doc.resolve(targetPos),
			dir
		);
		const tr = this.view.state.tr.setSelection(selection).scrollIntoView();

		this.view.dispatch(tr);
		this.view.focus();

		return false;
	}

	update(node: Node) {
		if (node.type != this.node.type) return false;

		this.node = node;

		if (this.updating) return true;

		const newText = node.textContent;
		const curText = this.cm.state.doc.toString();

		if (newText != curText) {
			let start = 0;
			let curEnd = curText.length;
			let newEnd = newText.length;

			while (
				start < curEnd &&
				curText.charCodeAt(start) == newText.charCodeAt(start)
			) {
				++start;
			}

			while (
				curEnd > start &&
				newEnd > start &&
				curText.charCodeAt(curEnd - 1) == newText.charCodeAt(newEnd - 1)
			) {
				curEnd--;
				newEnd--;
			}

			this.updating = true;

			this.cm.dispatch({
				changes: {
					from: start,
					to: curEnd,
					insert: newText.slice(start, newEnd)
				}
			});

			this.updating = false;
		}

		return true;
	}

	selectNode() {
		this.cm.focus();
	}

	stopEvent() {
		return true;
	}

	destroy() {
		this.cm.destroy();
		this.observer.disconnect();
	}
}

function arrowHandler(dir: 'left' | 'right' | 'up' | 'down'): Command {
	return (state, dispatch, view) => {
		if (state.selection.empty && view && view.endOfTextblock(dir)) {
			const side = dir == 'left' || dir == 'up' ? -1 : 1;
			const $head = state.selection.$head;
			const nextPos = Selection.near(
				state.doc.resolve(side > 0 ? $head.after() : $head.before()),
				side
			);

			if (nextPos.$head && nextPos.$head.parent.type.name == 'code_block') {
				if (dispatch) dispatch(state.tr.setSelection(nextPos));
				return true;
			}
		}

		return false;
	};
}

export const cmArrowHandlers = keymap({
	ArrowLeft: arrowHandler('left'),
	ArrowRight: arrowHandler('right'),
	ArrowUp: arrowHandler('up'),
	ArrowDown: arrowHandler('down')
});

import type { ProseMirrorComponent } from '../';
import type { NodeSpec } from 'prosemirror-model';
import {
	EditorView as CodeMirror,
	keymap as cmKeymap,
	drawSelection,
	type ViewUpdate,
	type KeyBinding,
	type Command as CodeMirrorCommand
} from '@codemirror/view';
import { defaultKeymap, indentWithTab } from '@codemirror/commands';
import {
	Compartment,
	type Line,
	Prec,
	type SelectionRange
} from '@codemirror/state';
import { indentOnInput, LanguageDescription } from '@codemirror/language';
import { autocompletion, closeBrackets } from '@codemirror/autocomplete';
import { languages } from '@codemirror/language-data';
import ReactCodeMirror, {
	type ReactCodeMirrorRef
} from '@uiw/react-codemirror';
import { githubDark, githubLight } from '@uiw/codemirror-theme-github';

import { textblockTypeInputRule } from 'prosemirror-inputrules';
import { keymap } from 'prosemirror-keymap';
import { Selection, TextSelection, type Command } from 'prosemirror-state';
import { exitCode } from 'prosemirror-commands';
import { undo, redo } from 'prosemirror-history';

import {
	forwardRef,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState
} from 'react';
import {
	type NodeViewComponentProps,
	useEditorEventCallback,
	useStopEvent
} from '@handlewithcare/react-prosemirror';

// https://github.com/handlewithcarecollective/react-prosemirror/blob/main/demo/nodeViews/CodeBlock.tsx
// Copyright (C) 2025 Handle with Care Collective, licensed under Apache-2.0

// TODO: https://github.com/handlewithcarecollective/react-prosemirror/issues/146

export const CodeBlock = forwardRef<
	HTMLDivElement | null,
	NodeViewComponentProps
>(function CodeBlock({ nodeProps, ...props }, ref) {
	const { node, getPos } = nodeProps;

	const cmViewRef = useRef<CodeMirror | null>(null);

	const onCommit = useEditorEventCallback((view) => {
		if (!exitCode(view.state, view.dispatch)) {
			return false;
		}
		view.focus();
		return true;
	});

	const onUndo = useEditorEventCallback((view) => {
		return undo(view.state, view.dispatch, view);
	});

	const onRedo = useEditorEventCallback((view) => {
		return redo(view.state, view.dispatch, view);
	});

	const onDelete = useEditorEventCallback((view, cmView: CodeMirror) => {
		if (cmView.state.doc.length === 0) {
			const pos = getPos();
			const emptyParagraph = view.state.schema.nodes.paragraph.create();

			const tr = view.state.tr;

			tr.replaceRangeWith(
				pos,
				pos + nodeProps.node.nodeSize + 1,
				emptyParagraph
			)
				.setSelection(Selection.near(tr.doc.resolve(tr.mapping.map(pos)), 1))
				.scrollIntoView();

			view.dispatch(tr);
			view.focus();
			return true;
		}

		return false;
	});

	const withMaybeEscape = useEditorEventCallback(
		(view, unit: 'line' | 'char', dir: -1 | 1, cmView: CodeMirror) => {
			const state = cmView.state;
			if (!state) {
				return false;
			}

			let main: SelectionRange | Line = state.selection.main;
			if (!main.empty) {
				return false;
			}

			if (unit == 'line') {
				main = state.doc.lineAt(main.head);
			}

			if (dir < 0 ? main.from > 0 : main.to < state.doc.length) {
				return false;
			}

			const targetPos = (getPos() || 0) + (dir < 0 ? 0 : node.nodeSize);
			const sel = Selection.near(view.state.doc.resolve(targetPos), dir);

			view.dispatch(view.state.tr.setSelection(sel).scrollIntoView());
			view.focus();

			return true;
		}
	);

	const keymap = useMemo<readonly KeyBinding[]>(
		() => [
			{
				key: 'ArrowUp',
				run: ((view) => withMaybeEscape('line', -1, view)) as CodeMirrorCommand
			},
			{
				key: 'ArrowLeft',
				run: ((view) => withMaybeEscape('char', -1, view)) as CodeMirrorCommand
			},
			{
				key: 'ArrowDown',
				run: ((view) => withMaybeEscape('line', 1, view)) as CodeMirrorCommand
			},
			{
				key: 'ArrowRight',
				run: ((view) => withMaybeEscape('char', 1, view)) as CodeMirrorCommand
			},
			{
				key: 'Ctrl-Enter',
				run: onCommit as CodeMirrorCommand
			},
			{ key: 'Ctrl-z', mac: 'Cmd-z', run: onUndo as CodeMirrorCommand },
			{
				key: 'Shift-Ctrl-z',
				mac: 'Shift-Cmd-z',
				run: onRedo as CodeMirrorCommand
			},
			{ key: 'Ctrl-y', mac: 'Cmd-y', run: onRedo as CodeMirrorCommand },
			{ key: 'Backspace', run: onDelete as CodeMirrorCommand },
			{ key: 'Delete', run: onDelete as CodeMirrorCommand }
		],
		[onCommit, onDelete, onRedo, onUndo, withMaybeEscape]
	);

	const onUpdate = useEditorEventCallback((view, update: ViewUpdate) => {
		if (update.state.doc.toString() === node.textContent) {
			return;
		}
		if (!update.view.hasFocus) {
			return;
		}

		let offset = (getPos() ?? 0) + 1;
		const { main } = update.state.selection;
		const selFrom = offset + main.from;
		const selTo = offset + main.to;

		const tr = view.state.tr;

		const pmSel = tr.selection;
		if (update.docChanged || pmSel.from != selFrom || pmSel.to != selTo) {
			update.changes.iterChanges((fromA, toA, fromB, toB, text) => {
				if (text.length) {
					tr.replaceWith(
						offset + fromA,
						offset + toA,
						view.state.schema.text(text.toString())
					);
				} else {
					tr.delete(offset + fromA, offset + toA);
				}
				offset += toB - fromB - (toA - fromA);
			});

			tr.setSelection(TextSelection.create(tr.doc, selFrom, selTo));
		}

		view.dispatch(tr);
	});

	const getTheme = useCallback(() => {
		return document.documentElement.classList.contains('dark')
			? githubDark
			: githubLight;
	}, []);

	const [theme, setTheme] = useState(getTheme());
	const [language] = useState(new Compartment());

	const extensions = useMemo(
		() => [
			drawSelection(),
			Prec.highest(cmKeymap.of([...keymap, ...defaultKeymap, indentWithTab])),
			drawSelection(),
			indentOnInput(),
			autocompletion(),
			closeBrackets(),
			language.of([])
		],
		[keymap, language]
	);

	useEffect(() => {
		const observer = new MutationObserver((mutations) => {
			mutations.forEach((m) => {
				if (
					(m.type !== 'attributes' && m.attributeName !== 'class') ||
					!(m.target instanceof HTMLElement)
				)
					return;
				setTheme(getTheme());
			});
		});

		observer.observe(document.documentElement, { attributes: true });

		return () => observer.disconnect();
	}, [getTheme]);

	useEffect(() => {
		const lang = node.attrs.language;
		const extension = LanguageDescription.matchLanguageName(languages, lang);

		if (extension) {
			extension.load().then((ext) => {
				cmRef.current?.view?.dispatch({
					effects: language.reconfigure(ext)
				});
			});
		} else {
			cmRef.current?.view?.dispatch({
				effects: language.reconfigure([])
			});
		}
	}, [language, node.attrs.language]);

	useStopEvent((view, event) => {
		if (event instanceof InputEvent) return true;
		return false;
	});

	const onFocus = useEditorEventCallback((view) => {
		const pmSel = view.state.selection;
		const cmSel = cmViewRef.current?.state.selection.main;

		if (!cmSel) {
			return;
		}

		const offset = (getPos() ?? 0) + 1;
		const selFrom = offset + cmSel.from;
		const selTo = offset + cmSel.to;

		if (pmSel.from === selFrom && pmSel.to === selTo) {
			return;
		}

		let tr = view.state.tr;
		tr = tr.setSelection(TextSelection.create(tr.doc, selFrom, selTo));
		view.dispatch(tr);
	});

	const cmRef = useRef<ReactCodeMirrorRef>(null);

	const onCreateEditor = useEditorEventCallback((view, cmView: CodeMirror) => {
		if (cmViewRef.current === cmView) {
			return;
		}

		cmViewRef.current = cmView;

		// When a new CodeBlock is created, if it contains
		// the ProseMirror selection, focus it
		if (
			cmViewRef.current &&
			view.state.selection.from >= getPos() &&
			view.state.selection.to <= getPos() + node.nodeSize
		) {
			cmViewRef.current.focus();
		}
	});

	return (
		<div
			{...props}
			className="CodeMirror-container"
			ref={ref}
			contentEditable={false}
			onClick={(_e) => {
				cmViewRef.current?.focus();
			}}
		>
			<ReactCodeMirror
				ref={cmRef}
				onCreateEditor={(view) => {
					try {
						onCreateEditor(view);
					} catch {
						// HACK: this happens when the doc is initialized with a code block already there. issue due to react-codemirror 4.23.10
					}
				}}
				onUpdate={onUpdate}
				value={node.textContent}
				basicSetup={{
					lineNumbers: false,
					foldGutter: false,
					highlightActiveLine: false,
					autocompletion: true
				}}
				extensions={extensions}
				theme={theme}
				onFocus={onFocus}
			/>

			<span className="CodeMirror-languagelabel">
				{node.attrs.language.length ? node.attrs.language : 'plaintext'}
			</span>
		</div>
	);
});

// https://github.com/ProseMirror/website/blob/master/example/codemirror/index.js
// https://prosemirror.net/examples/codemirror/
// Copyright (C) 2015-2017 by Marijn Haverbeke <marijn@haverbeke.berlin> and others (MIT)

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

const cmArrowHandlers = keymap({
	ArrowLeft: arrowHandler('left'),
	ArrowRight: arrowHandler('right'),
	ArrowUp: arrowHandler('up'),
	ArrowDown: arrowHandler('down')
});

export const codeComponent = {
	plugins: [cmArrowHandlers],
	nodes: {
		code_block: {
			group: 'block',
			content: 'text*',
			attrs: { language: { default: '', validate: 'string' } },
			marks: '',
			code: true,
			defining: true,
			toDOM() {
				return ['pre', ['code', 0]];
			},
			parseDOM: [{ tag: 'pre', preserveWhitespace: 'full' }]
		} as NodeSpec
	},
	inputRules: (schema) => [
		textblockTypeInputRule(
			/^```([a-z]*)\s+$/,
			schema.nodes.code_block,
			(match) => {
				const language = LanguageDescription.matchLanguageName(
					languages,
					match[1]
				);
				if (language) {
					const alias =
						language.alias.length && !language.alias[0].includes(' ')
							? language.alias[0]
							: language.name;
					return { language: alias };
				}
			}
		)
	],
	reactNodeViews: {
		code_block: CodeBlock
	}
} satisfies ProseMirrorComponent;

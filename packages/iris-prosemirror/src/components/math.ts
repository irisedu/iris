import type { ProseMirrorComponent } from '../';
import type { MarkSpec, Node, NodeSpec } from 'prosemirror-model';
import {
	Plugin,
	Selection,
	PluginKey,
	type EditorState,
	type Command,
	type Transaction
} from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';
import { toggleMark } from 'prosemirror-commands';
import { insertNode } from '../utils';
import KaTeX from 'katex';

const pluginKey = new PluginKey('katex');

function getKaTeXDecorations(
	doc: Node,
	selection: Selection,
	preview: boolean
) {
	const decos: Decoration[] = [];

	function render(
		node: Node,
		pos: number,
		focused: boolean,
		displayMode: boolean
	) {
		const elem = document.createElement('span');
		elem.classList.add('katex-render');

		if (!preview && !focused) return elem;

		if (displayMode) elem.classList.add('katex-render--display');
		if (preview) elem.classList.add('katex-render--preview');
		if (focused && !preview) elem.classList.add('katex-render--focus');

		const $pos = doc.resolve(pos);
		const { $head } = Selection.near($pos, 1);
		elem.dataset.pos = $head.pos.toString();

		const content = node.textContent.trim();
		if (!content.length) elem.classList.add('katex-render--empty');

		try {
			KaTeX.render(content, elem, { displayMode });
		} catch (err: unknown) {
			elem.classList.add('katex-render--error');
			elem.innerHTML = String(err);
		}

		return elem;
	}

	doc.descendants((node, pos) => {
		// Based on https://github.com/benrbray/prosemirror-math/blob/master/lib/math-nodeview.ts
		// Copyright © 2020-2024 Benjamin R. Bray (MIT)

		const key = (focused: boolean) =>
			`${node.textContent}_${focused}_${preview}`;

		if (node.type.name === 'math_display') {
			const focused = selection.$head.parent === node;

			decos.push(
				Decoration.widget(pos, () => render(node, pos, focused, true), {
					key: key(focused)
				})
			);
		} else if (node.marks.some((m) => m.type.name === 'math_inline')) {
			const focused = node === doc.nodeAt(Math.max(0, selection.head - 1)); // ???

			decos.push(
				Decoration.widget(pos, () => render(node, pos, focused, false), {
					side: -1,
					key: key(focused)
				})
			);
		}
	});

	return DecorationSet.create(doc, decos);
}

const katexPlugin = new Plugin({
	state: {
		init(_, { doc, selection }) {
			return {
				preview: false,
				decorations: getKaTeXDecorations(doc, selection, false)
			};
		},
		apply(tr, old) {
			const preview =
				tr.getMeta(pluginKey) === undefined
					? old.preview
					: tr.getMeta(pluginKey);

			return {
				preview,
				decorations: getKaTeXDecorations(tr.doc, tr.selection, preview)
			};
		}
	},
	props: {
		decorations(state) {
			return this.getState(state)?.decorations;
		},
		handleClick(view, _, event) {
			if (!event.target || !(event.target instanceof HTMLElement)) return;

			const renderElem = event.target.closest('.katex-render');
			if (renderElem instanceof HTMLElement) {
				const pos = renderElem.dataset.pos;
				if (!pos) return true;

				view.dispatch(
					view.state.tr
						.setMeta(pluginKey, false)
						.setSelection(Selection.near(view.state.doc.resolve(+pos)))
				);

				return true;
			}
		}
	},
	filterTransaction(tr, state) {
		if (!tr.docChanged) return true;

		const mathInline = state.schema.marks.math_inline;
		let dirty = false;

		function nodeIsDirty(node: Node) {
			return !node.isText && mathInline.isInSet(node.marks);
		}

		tr.before.descendants((node) => {
			if (dirty) return false;
			if (nodeIsDirty(node)) dirty = true;
		});

		// Document is already dirty, do nothing
		if (dirty) return true;

		tr.doc.descendants((node) => {
			if (dirty) return false;
			if (nodeIsDirty(node)) dirty = true;
		});

		return !dirty;
	}
});

function getMathPreviewEnabled(state: EditorState) {
	const pluginState = katexPlugin.getState(state);
	return pluginState ? pluginState.preview : false;
}

function setMathPreviewEnabled(enabled: boolean): Command {
	return (state, dispatch) => {
		if (dispatch) {
			const tr = state.tr.setMeta(pluginKey, enabled);

			if (enabled) tr.removeStoredMark(state.schema.marks.math_inline);

			dispatch(tr);
		}

		return true;
	};
}

const toggleInlineMath: Command = (state, dispatch) => {
	const inlineMath = state.schema.marks.math_inline;
	if (!toggleMark(inlineMath)(state)) return false;

	if (dispatch) {
		let tr: Transaction | undefined;
		toggleMark(inlineMath)(state, (cmdTr) => (tr = cmdTr));

		if (tr) {
			tr.setMeta(pluginKey, false);
			dispatch(tr);
		}
	}

	return true;
};

const insertDisplayMath: Command = (state, dispatch) => {
	const displayMath = state.schema.nodes.math_display;
	if (!insertNode(displayMath)(state)) return false;

	if (dispatch) {
		let tr: Transaction | undefined;
		insertNode(displayMath)(state, (cmdTr) => (tr = cmdTr));

		if (tr) {
			const { $head } = state.selection;
			const newPos = $head.pos + ($head.parent.childCount ? 1 : 0);
			tr.setSelection(Selection.near(tr.doc.resolve(newPos)));
			tr.setMeta(pluginKey, false);
			dispatch(tr);
		}
	}

	return true;
};

export const mathComponent = {
	plugins: [katexPlugin],
	nodes: {
		math_display: {
			group: 'block',
			content: 'text*',
			marks: '',
			isolating: true,
			defining: true,
			code: true,
			toDOM() {
				return ['pre', { class: 'math-display' }, ['code', 0]];
			}
		} as NodeSpec
	},
	marks: {
		math_inline: {
			excludes: '_',
			toDOM() {
				return ['code', { class: 'math-inline' }, 0];
			}
		} as MarkSpec
	},
	commands: {
		getMathPreviewEnabled,
		setMathPreviewEnabled,
		toggleInlineMath,
		insertDisplayMath
	}
} satisfies ProseMirrorComponent;

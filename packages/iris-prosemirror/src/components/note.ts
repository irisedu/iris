import { ProseMirrorComponent } from '../';
import type { Schema, NodeSpec } from 'prosemirror-model';
import { InputRule } from 'prosemirror-inputrules';
import { type Command } from 'prosemirror-state';

function createNote(schema: Schema, noteType: string) {
	const noteLabels: Record<string, string> = {
		info: 'Info',
		warning: 'Warning',
		tip: 'Tip',
		problem: 'Problem',
		exercise: 'Exercise'
	};

	const label = noteLabels[noteType];
	if (!label) return null;

	const node = schema.nodes.note.createChecked({ type: noteType }, [
		schema.nodes.note_label.createChecked(null, schema.text(label)),
		schema.nodes.paragraph.createAndFill()!
	]);

	return { node, label };
}

function insertNote(noteType: string): Command {
	return (state, dispatch) => {
		const note = createNote(state.schema, noteType);
		if (!note) return false;

		if (dispatch) {
			dispatch(state.tr.replaceSelectionWith(note.node));
		}

		return true;
	};
}

export const noteComponent = {
	nodes: {
		note: {
			group: 'block',
			attrs: { type: { default: 'info', validate: 'string' } },
			content: 'note_label block+',
			toDOM(node) {
				return ['div', { class: `note ${node.attrs.type}` }, 0];
			}
		} as NodeSpec,
		note_label: {
			content: 'inline*',
			toDOM() {
				return ['p', { class: 'note__label' }, 0];
			}
		}
	},
	inputRules: (schema) => [
		new InputRule(/<(\S+)\s$/, (state, match, start, end) => {
			const noteType = match[1];
			const note = createNote(schema, noteType);
			if (!note) return null;

			return state.tr.replaceRangeWith(start, end, note.node);
		})
	],
	commands: {
		createNote,
		insertNote
	}
} satisfies ProseMirrorComponent;

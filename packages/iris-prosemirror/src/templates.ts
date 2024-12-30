import { docSchema } from './configs';
import type { Node } from 'prosemirror-model';

const SCHEMA_VERSION = 1;

export function saveFile(doc: Node) {
	return JSON.stringify(
		{
			version: SCHEMA_VERSION,
			data: doc.toJSON()
		},
		null,
		'\t'
	);
}

export const emptyTemplate = saveFile(docSchema.nodes.doc.createAndFill()!);

export const summaryTemplate = saveFile(
	docSchema.nodes.doc.createChecked(null, [
		docSchema.nodes.frontmatter.createAndFill()!,
		docSchema.nodes.paragraph.createChecked(null, [
			docSchema.text('Place an optional module description here.')
		]),
		docSchema.nodes.summary.createAndFill()!
	])
);

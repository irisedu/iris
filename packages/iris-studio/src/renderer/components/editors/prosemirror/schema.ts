import { Schema, type NodeSpec, type MarkSpec } from 'prosemirror-model';
import { orderedList, bulletList, listItem } from 'prosemirror-schema-list';
import { tableNodes } from 'prosemirror-tables';

// Some portions from https://github.com/ProseMirror/prosemirror-schema-basic/blob/master/src/schema-basic.ts
// Copyright (C) 2015-2017 by Marijn Haverbeke <marijn@haverbeke.berlin> and others (MIT)
const baseSchemaDef = {
	nodes: {
		doc: { content: '(block | heading)+' } as NodeSpec,
		text: { group: 'inline' } as NodeSpec,
		nbsp: {
			group: 'inline',
			inline: true,
			toDOM() {
				return ['span', { class: 'display-nbsp' }, '\u00A0'];
			},
			parseDOM: [{ tag: 'span.display-nbsp' }]
		} as NodeSpec,

		paragraph: {
			group: 'block',
			content: '(inline | sidenote)*',
			toDOM() {
				return ['p', 0];
			},
			parseDOM: [{ tag: 'p' }]
		} as NodeSpec,
		hard_break: {
			group: 'inline',
			inline: true,
			selectable: false,
			toDOM() {
				return ['br'];
			},
			parseDOM: [{ tag: 'br' }]
		} as NodeSpec,
		horizontal_rule: {
			group: 'block',
			toDOM() {
				return ['hr'];
			},
			parseDOM: [{ tag: 'hr' }]
		} as NodeSpec,
		heading: {
			content: '(inline | sidenote)*',
			attrs: { level: { default: 2, validate: 'number' } },
			defining: true,
			toDOM(node) {
				return ['h' + node.attrs.level, 0];
			},
			parseDOM: [
				{ tag: 'h2', attrs: { level: 2 } },
				{ tag: 'h3', attrs: { level: 3 } },
				{ tag: 'h4', attrs: { level: 4 } }
			]
		} as NodeSpec,
		sidenote: {
			content: 'block+',
			attrs: { numbered: { default: false, validate: 'boolean' } },
			inline: true,
			isolating: true,
			draggable: true,
			toDOM(node) {
				let containerClass = 'sidenote-container';
				if (node.attrs.numbered) containerClass += ' numbered';

				return [
					'div',
					{ class: containerClass },
					['span', { class: 'sidenote' }, 0]
				];
			},
			parseDOM: [{ tag: 'aside' }]
		} as NodeSpec,

		ordered_list: {
			...orderedList,
			content: 'list_item+',
			group: 'block'
		} as NodeSpec,
		bullet_list: {
			...bulletList,
			content: 'list_item+',
			group: 'block'
		} as NodeSpec,
		list_item: {
			...listItem,
			content: 'paragraph block*'
		} as NodeSpec,

		...tableNodes({
			tableGroup: 'block',
			cellContent: 'block+',
			cellAttributes: {
				justify: {
					default: 'left',
					getFromDOM(dom) {
						return dom.style.getPropertyValue('text-align');
					},
					setDOMAttr(value, attrs) {
						if (value)
							attrs.style = (attrs.style || '') + `text-align: ${value};`;
					}
				}
			}
		}),

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
		} as NodeSpec,

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
		} as NodeSpec,

		figure: {
			group: 'block',
			allowGapCursor: true,
			draggable: true,
			content:
				'(figure_contents figure_caption?) | (figure_caption? figure_contents)',
			attrs: {
				float: { default: '', validate: 'string' },
				width: { default: '33%', validate: 'string' }
			},
			toDOM(node) {
				const { float, width } = node.attrs as { float: string; width: string };
				const domClasses: Record<string, string> = {
					left: 'figure-left',
					right: 'figure-right'
				};

				const domClass = float.length ? domClasses[float] : undefined;
				const domStyle = width.length ? `width: ${width};` : undefined;

				return ['figure', { class: domClass, style: domStyle }, 0];
			},
			parseDOM: [
				{
					tag: 'figure',
					getAttrs(node) {
						return { float: node.style.float };
					}
				}
			]
		} as NodeSpec,
		figure_caption: {
			content: 'inline*',
			toDOM() {
				return ['figcaption', 0];
			},
			parseDOM: [{ tag: 'figcaption' }]
		} as NodeSpec,
		image: {
			group: 'figure_contents',
			attrs: {
				src: { default: '', validate: 'string' },
				alt: { default: '', validate: 'string' }
			},
			toDOM(node) {
				const { src, alt } = node.attrs as {
					src: string;
					alt: string;
				};

				if (!src.length) return ['img', { alt }];

				try {
					new URL(src);
					return ['img', { src, alt }];
				} catch {
					return ['img', { src: 'asset://' + src, alt }];
				}
			},
			parseDOM: [
				{
					tag: 'img',
					getAttrs(node) {
						return {
							src: node.getAttribute('src') ?? '',
							alt: node.getAttribute('alt') ?? ''
						};
					}
				}
			]
		} as NodeSpec
	},
	marks: {
		// Keep as first to render as parent of all other marks
		link: {
			attrs: { href: { default: '', validate: 'string' } },
			inclusive: false,
			excludes: 'underline',
			toDOM(node) {
				return ['a', node.attrs, 0];
			},
			parseDOM: [
				{
					tag: 'a[href]',
					getAttrs(dom) {
						return { href: dom.getAttribute('href') };
					}
				}
			]
		} as MarkSpec,

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

		math_inline: {
			excludes: '_',
			toDOM() {
				return ['code', { class: 'math-inline' }, 0];
			}
		} as MarkSpec
	}
};

const docSchemaDef = {
	nodes: {
		...baseSchemaDef.nodes,
		doc: { content: 'frontmatter (block | heading | summary)+' } as NodeSpec,

		frontmatter: {
			content: 'title frontmatter_attributes',
			toDOM() {
				return ['div', { class: 'frontmatter' }, 0];
			}
		} as NodeSpec,
		title: {
			content: 'inline*',
			toDOM() {
				return ['h1', { class: 'title' }, 0];
			},
			parseDOM: [{ tag: 'h1' }]
		} as NodeSpec,
		frontmatter_attributes: {
			attrs: { data: { default: null } },
			selectable: false
		} as NodeSpec,

		summary: {
			content: '(summary_list | summary_heading)+',
			draggable: true,
			toDOM() {
				return ['div', { class: 'summary' }, 0];
			}
		} as NodeSpec,
		summary_heading: {
			content: 'inline*',
			toDOM() {
				return ['span', { class: 'summary-heading' }, 0];
			}
		} as NodeSpec,
		summary_list: {
			...bulletList,
			content: 'summary_list_item+'
		} as NodeSpec,
		summary_list_item: {
			...listItem,
			content: 'summary_page summary_list*'
		} as NodeSpec,
		summary_page: {
			content: 'text*',
			marks: '',
			toDOM() {
				return ['span', { class: 'summary-page' }, 0];
			}
		} as NodeSpec
	},
	marks: {
		...baseSchemaDef.marks
	}
};

export const baseSchema = new Schema(baseSchemaDef);
export const docSchema = new Schema(docSchemaDef);

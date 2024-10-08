import type { ProseMirrorComponent } from '../';
import type { NodeSpec } from 'prosemirror-model';

export const figureComponent = {
	nodes: {
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
	}
} satisfies ProseMirrorComponent;

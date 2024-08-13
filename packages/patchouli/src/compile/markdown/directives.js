import { h } from 'hastscript';
import { visit } from 'unist-util-visit';
import {
	vfileMessage,
	resolveInternalLink,
	internalLinkToAssetTag
} from '../../utils.js';

function handleTextDirective(node, file, opts) {
	const attrs = node.attributes || {};

	switch (node.name) {
		case 'abbr':
			return h('abbr', { title: attrs.title });

		default:
			vfileMessage(
				file,
				node,
				'invalid-directive',
				`Unknown text directive \`${node.name}\``
			);
	}
}

function handleLeafDirective(node, file, opts) {
	const attrs = node.attributes || {};

	switch (node.name) {
		case 'iframe': {
			let { src, width, height } = attrs;
			if (!src) {
				vfileMessage(
					file,
					node,
					'iframe-src',
					'The `iframe` directive requires a `src` attribute.'
				);
				return;
			}

			const internalLink = resolveInternalLink(src, opts.filePath);
			if (internalLink) {
				const assetTag = internalLinkToAssetTag(internalLink);
				const assets = file.data.assets || (file.data.assets = {});
				assets[assetTag] = internalLink;

				src = `####${assetTag}####`;
			}

			return h('iframe', { src, width, height });
		}

		case 'summary':
			return h('summary');

		default:
			vfileMessage(
				file,
				node,
				'invalid-directive',
				`Unknown leaf directive \`${node.name}\``
			);
	}
}

function handleContainerDirective(node, file, opts) {
	const attrs = node.attributes || {};

	switch (node.name) {
		case 'note': {
			const className = attrs.class;
			if (!className) {
				vfileMessage(
					file,
					node,
					'invalid-note-directive',
					'The `note` directive requires a class name.'
				);
				return;
			}

			const messages = opts.config.platform.markdown.messageTypes;

			if (!messages[className]) {
				vfileMessage(
					file,
					node,
					'invalid-note-directive',
					`Invalid note class name \`${className}\``
				);
				return;
			}

			node.children.unshift({
				type: 'html',
				value: `<span class="note__label"><strong>${messages[className]}</strong></span>`
			});

			return h('div', { class: `note ${className}` });
		}

		case 'comment': {
			const className = attrs.class;
			if (!className) {
				vfileMessage(
					file,
					node,
					'invalid-note-directive',
					'The `comment` directive requires a class name.'
				);
				return;
			}

			const firstClass = className.split(' ')[0];
			const character = opts.config.platform.markdown.characters[firstClass];

			if (!character) {
				vfileMessage(
					file,
					node,
					'invalid-note-directive',
					`Invalid comment class name \`${className}\``
				);
				return;
			}

			node.children.unshift({
				type: 'html',
				value: `<span class="comment__character"><a href="${character.url}">${character.name}</a></span>`
			});

			return h('div', { class: `comment ${className}` });
		}

		case 'figure':
			return h('figure');

		case 'figcaption':
			return h('figcaption');

		case 'details':
			return h('details');

		case 'summary':
			return h('div', { id: 'patchouli-summary' });

		default:
			vfileMessage(
				file,
				node,
				'invalid-directive',
				`Unknown container directive \`${node.name}\``
			);
	}
}

export default function remarkProcessDirectives(opts) {
	return (tree, file) => {
		visit(tree, (node) => {
			let hast;

			switch (node.type) {
				case 'textDirective':
					hast = handleTextDirective(node, file, opts);
					break;
				case 'leafDirective':
					hast = handleLeafDirective(node, file, opts);
					break;
				case 'containerDirective':
					hast = handleContainerDirective(node, file, opts);
					break;
			}

			if (hast) {
				const data = node.data || (node.data = {});

				data.hName = hast.tagName;
				data.hProperties = hast.properties;
			}
		});
	};
}

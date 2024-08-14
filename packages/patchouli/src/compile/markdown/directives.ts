import { h } from 'hastscript';
import { visit } from 'unist-util-visit';
import { resolveInternalLink, internalLinkToAssetTag } from '../../utils';

function handleTextDirective(node, file, opts) {
	const attrs = node.attributes || {};

	switch (node.name) {
		case 'abbr':
			return h('abbr', { title: attrs.title });
	}
}

function handleLeafDirective(node, file, opts) {
	const attrs = node.attributes || {};

	switch (node.name) {
		case 'iframe': {
			let { src, width, height } = attrs;
			if (!src) {
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
	}
}

function handleContainerDirective(node, file, opts) {
	const attrs = node.attributes || {};

	switch (node.name) {
		case 'note': {
			const className = attrs.class;
			if (!className) {
				return;
			}

			const messages = opts.config.platform.markdown.messageTypes;

			if (!messages[className]) {
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
				return;
			}

			const firstClass = className.split(' ')[0];
			const character = opts.config.platform.markdown.characters[firstClass];

			if (!character) {
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

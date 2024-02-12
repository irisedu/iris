import { h } from 'hastscript';
import { visit } from 'unist-util-visit';
import { vfileMessage, resolveInternalLink, internalLinkToAssetTag } from './utils.js';
import { resolveCompiledPath } from './compiledAssets.js';

function handleTextDirective(node, file, opts) {
    const attrs = node.attributes || {};

    switch (node.name) {
    case 'abbr':
        return h('abbr', { title: attrs.title });

    default:
        vfileMessage(file, node, 'invalid-directive', `Unknown text directive \`${node.name}\``);
    }
}

function handleLeafDirective(node, file, opts) {
    const attrs = node.attributes || {};

    switch (node.name) {
    case 'teximg': {
        const { src, alt } = attrs;
        if (!src || !alt) {
            vfileMessage(file, node, 'tex-directive-src', 'The `teximg` directive requires `src` and `alt` attributes.');
            return;
        }

        const internalLink = resolveInternalLink(src, opts.currentSeries);
        if (!internalLink) {
            vfileMessage(file, node, 'tex-directive-src', 'The `teximg` directive requires a `src` within Iris.');
            return;
        }

        const assetTag = internalLinkToAssetTag(internalLink);
        const assets = file.data.assets || (file.data.assets = {});
        assets[assetTag] = resolveCompiledPath(internalLink);

        return h('img', { src: `####${assetTag}####`, alt });
    }

    case 'iframe': {
        let { src, width, height } = attrs;
        if (!src) {
            vfileMessage(file, node, 'iframe-src', 'The `iframe` directive requires a `src` attribute.');
            return;
        }

        const internalLink = resolveInternalLink(src, opts.currentSeries);
        if (internalLink) {
            const assetTag = internalLinkToAssetTag(internalLink);
            const assets = file.data.assets || (file.data.assets = {});
            assets[assetTag] = resolveCompiledPath(internalLink);

            src = `####${assetTag}####`;
        }

        return h('iframe', { src, width, height });
    }

    default:
        vfileMessage(file, node, 'invalid-directive', `Unknown leaf directive \`${node.name}\``);
    }
}

function handleContainerDirective(node, file, opts) {
    const attrs = node.attributes || {};

    switch (node.name) {
    case 'note': {
        const className = attrs.class;
        if (!className) {
            vfileMessage(file, node, 'invalid-note-directive', 'The `note` directive requires a class name.');
            return;
        }

        const messages = {
            info: 'Note',
            warning: 'Warning',
            tip: 'Tip',
        };

        if (!messages[className]) {
            vfileMessage(file, node, 'invalid-note-directive', `Invalid note class name \`${className}\``);
            return;
        }

        node.children.unshift({
            type: 'html',
            value: `<span class="note__label"><strong>${messages[className]}</strong></span>`,
        });

        return h('div', { class: `note ${className}` });
    }

    case 'figure':
        return h('figure');

    case 'figcaption':
        return h('figcaption');

    default:
        vfileMessage(file, node, 'invalid-directive', `Unknown container directive \`${node.name}\``);
    }
}

export default function remarkProcessDirectives(opts) {
    return (tree, file) => {
        visit(tree, node => {
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

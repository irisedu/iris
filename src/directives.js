import { h } from 'hastscript';
import { visit } from 'unist-util-visit';
import { vfileMessage } from './utils.js';

function handleTextDirective(node, file) {
    const attrs = node.attributes || {};

    switch (node.name) {
    case 'abbr':
        return h('abbr', { title: attrs.title });

    default:
        vfileMessage(file, node, 'invalid-directive', `Unknown text directive \`${node.name}\``);
    }
}

function handleLeafDirective(node, file) {
    const attrs = node.attributes || {};

    switch (node.name) {
    default:
        vfileMessage(file, node, 'invalid-directive', `Unknown leaf directive \`${node.name}\``);
    }
}

function handleContainerDirective(node, file) {
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

export default function remarkProcessDirectives() {
    return (tree, file) => {
        visit(tree, node => {
            let hast;

            switch (node.type) {
            case 'textDirective':
                hast = handleTextDirective(node, file);
                break;
            case 'leafDirective':
                hast = handleLeafDirective(node, file);
                break;
            case 'containerDirective':
                hast = handleContainerDirective(node, file);
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

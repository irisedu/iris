import path from 'path';
import { validate } from '@hyperjump/json-schema/draft-2020-12';
import { visit } from 'unist-util-visit';
import { headingRank } from 'hast-util-heading-rank';
import { toHtml } from 'hast-util-to-html';

import { vfileMessage, resolveInternalLink, internalLinkToPageLink, internalLinkToAssetTag  } from './utils.js';

export function remarkCheckFrontmatter() {
    return async (_, file) => {
        const frontmatter = file.data.frontmatter;
        const result = await validate(path.join(import.meta.dirname, '../schemas/frontmatter.schema.json'), frontmatter);

        if (!result.valid)
            vfileMessage(file, null, 'frontmatter-schema', 'Frontmatter violates schema');
    };
}

// Expects the same options as rehype-citation
export function rehypeAddReferencesHeading(opts) {
    return tree => {
        if (!opts.bibliography || !opts.bibliography.length)
            return;

        tree.children.push({
            type: 'element',
            tagName: 'h2',
            properties: {},
            children: [
                {
                    type: 'text',
                    value: 'References'
                }
            ]
        });
    };
}

// Expects MarkdownRenderer (currentSeries) as opts
export function rehypeTransformIrisLinks(opts) {
    return (tree, file) => {
        visit(tree, node => {
            if (node.type !== 'element')
                return;

            const assetTags = {
                img: 'src',
            };

            if (node.tagName === 'a') {
                const href = node.properties.href;
                if (!href)
                    return;

                const internalLink = resolveInternalLink(href, opts.currentSeries);
                if (internalLink) {
                    const links = file.data.links || (file.data.links = []);
                    const hashSplit = internalLink.slice(1).split('#');
                    if (hashSplit.length > 1)
                        links.push(hashSplit.slice(0, -1).join('#'));
                    else
                        links.push(hashSplit[0]);

                    node.properties.href = internalLinkToPageLink(internalLink);
                }
            } else if (assetTags[node.tagName]) {
                // Replace asset links to make handling with web frameworks (e.g. SvelteKit) easier
                const linkProperty = assetTags[node.tagName];
                const link = node.properties[linkProperty];
                if (!link)
                    return;

                const internalLink = resolveInternalLink(link, opts.currentSeries);
                if (internalLink) {
                    const assetTag = internalLinkToAssetTag(internalLink);
                    node.properties[linkProperty] = `####${assetTag}####`;

                    const assets = file.data.assets || (file.data.assets = {});
                    assets[assetTag] = internalLink;
                }
            }
        });
    };
}

export function rehypeImageLazyLoading() {
    return tree => {
        visit(tree, node => {
            if (node.type !== 'element' || node.tagName !== 'img')
                return;

            node.properties.loading = 'lazy';
        });
    };
}

export function rehypeExtractToc() {
    return (tree, file) => {
        const toc = [];
        const currentStack = [];

        visit(tree, node => {
            const rank = headingRank(node);
            if (!rank)
                return;

            const heading = {
                rank,
                data: {
                    id: node.properties.id,
                    value: toHtml(node.children),
                }
            };

            while (currentStack.length && currentStack.at(-1).rank >= rank) {
                currentStack.pop();
            }

            if (currentStack.length) {
                const children = currentStack.at(-1).data.children || (currentStack.at(-1).data.children = []);
                children.push(heading.data);
            } else {
                toc.push(heading.data);
            }

            currentStack.push(heading);
        });

        file.data.toc = toc;
    };
}

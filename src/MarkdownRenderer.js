import { unified } from 'unified';

import remarkPresetLintRecommended from 'remark-preset-lint-recommended';
import remarkPresetLintMarkdownStyleGuide from 'remark-preset-lint-markdown-style-guide';
import remarkLintListItemSpacing from 'remark-lint-list-item-spacing';

import remarkParse from 'remark-parse';
import remarkRemoveComments from 'remark-remove-comments';
import remarkFrontmatter from 'remark-frontmatter';
import remarkExtractFrontmatter from 'remark-extract-frontmatter';
import remarkGfm from 'remark-gfm';
import remarkDirective from 'remark-directive';
import remarkProcessDirectives from './directives.js';
import remarkPrism from 'remark-prism';
import remarkSmartypants from 'remark-smartypants';
import remarkGemoji from 'remark-gemoji';
import remarkA11yEmoji from '@fec/remark-a11y-emoji';
import remarkMath from 'remark-math';
import remarkRehype from 'remark-rehype';

import rehypeCitation from 'rehype-citation';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeExtractToc from '@stefanprobst/rehype-extract-toc';
import rehypeMathjax from 'rehype-mathjax';
import rehypePresetMinify from 'rehype-preset-minify';
import rehypeStringify from 'rehype-stringify';

import crypto from 'crypto';
import path from 'path';
import toml from '@iarna/toml';
import { validate } from '@hyperjump/json-schema/draft-2020-12';
import { vfileMessage, resolveInternalLink, internalLinkToPageLink } from './utils.js';
import { visit } from 'unist-util-visit';

function rehypeAddReferencesHeading(opts) {
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

function remarkCheckFrontmatter() {
    return async (_, file) => {
        const frontmatter = file.data.frontmatter;
        const result = await validate(path.join(import.meta.dirname, '../schemas/frontmatter.schema.json'), frontmatter);

        if (!result.valid)
            vfileMessage(file, null, 'frontmatter-schema', 'Frontmatter violates schema');
    };
}

export default class MarkdownRenderer {
    currentSeries = 'IRIS-S-999X';

    #processor;
    #citationOptions = {
        linkCitations: true,
        inlineClass: ['citation'],
    };

    constructor() {
        this.#processor = unified()
            // lint
            .use(remarkPresetLintRecommended)
            .use(remarkPresetLintMarkdownStyleGuide)
            .use(remarkLintListItemSpacing, false)

            // remark
            .use(remarkParse)
            .use(remarkRemoveComments)
            .use(remarkFrontmatter, { type: 'toml', marker: '-' })
            .use(remarkExtractFrontmatter, { name: 'frontmatter', toml: toml.parse })
            .use(remarkCheckFrontmatter)
            .use(remarkGfm)
            .use(remarkDirective)
            .use(remarkProcessDirectives)
            .use(remarkPrism, {
                plugins: [
                    'line-numbers',
                    'autolinker',
                ]
            })
            .use(remarkSmartypants, { dashes: 'oldschool' })
            .use(remarkGemoji)
            .use(remarkA11yEmoji)
            .use(remarkMath, { singleDollarTextMath: false })
            .use(remarkRehype, { allowDangerousHtml: true })

            // rehype
            .use(this.rehypeTransformLinks.bind(this))
            .use(rehypeAddReferencesHeading, this.#citationOptions)
            .use(rehypeCitation, this.#citationOptions)
            .use(rehypeSlug)
            .use(rehypeAutolinkHeadings, {
                content: {
                    type: 'element',
                    tagName: 'span',
                    properties: {
                        'class': 'anchor-link'
                    },
                },
            })
            .use(rehypeExtractToc)
            .use(rehypeMathjax)
            .use(rehypePresetMinify)
            .use(rehypeStringify, { allowDangerousHtml: true });
    }

    rehypeTransformLinks() {
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

                    const internalLink = resolveInternalLink(href, this.currentSeries);
                    if (internalLink)
                        node.properties.href = internalLinkToPageLink(internalLink);
                } else if (assetTags[node.tagName]) {
                    // Replace asset links to make handling with web frameworks (e.g. SvelteKit) easier
                    const linkProperty = assetTags[node.tagName];
                    const link = node.properties[linkProperty];
                    if (!link)
                        return;

                    const internalLink = resolveInternalLink(link, this.currentSeries);
                    if (internalLink) {
                        const assetId = 'asset-' + crypto.createHash('md5').update(internalLink).digest('hex').slice(0, 12);
                        node.properties[linkProperty] = `####${assetId}####`;

                        const assetMap = file.data.assets || (file.data.assets = {});
                        assetMap[assetId] = internalLink;
                    }
                }
            });
        };
    }

    set bibliography(bib) {
        this.#citationOptions.bibliography = bib;
    }

    render(input) {
        return this.#processor.process(input);
    }
}

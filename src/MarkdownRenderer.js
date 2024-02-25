import { unified } from 'unified';

import remarkPresetLintRecommended from 'remark-preset-lint-recommended';
import remarkPresetLintMarkdownStyleGuide from 'remark-preset-lint-markdown-style-guide';
import remarkLintListItemSpacing from 'remark-lint-list-item-spacing';
import remarkLintMaximumLineLength from 'remark-lint-maximum-line-length';

import remarkParse from 'remark-parse';
import remarkRemoveComments from 'remark-remove-comments';
import remarkFrontmatter from 'remark-frontmatter';
import remarkExtractFrontmatter from 'remark-extract-frontmatter';
import remarkGfm from 'remark-gfm';
import remarkDirective from 'remark-directive';
import remarkProcessDirectives from './directives.js';
import remarkSmartypants from 'remark-smartypants';
import remarkGemoji from 'remark-gemoji';
import remarkA11yEmoji from '@fec/remark-a11y-emoji';
import remarkMath from 'remark-math';
import remarkRehype from 'remark-rehype';

import rehypeCitation from 'rehype-citation';
import rehypeSlug from 'rehype-slug';
import rehypeKatex from 'rehype-katex';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeStarryNight from '@microflash/rehype-starry-night';
import starryNightLanguageExtension from '@microflash/rehype-starry-night/header-language-extension';
import starryNightCaptionExtension from '@microflash/rehype-starry-night/header-caption-extension';
import rehypePresetMinify from 'rehype-preset-minify';
import rehypeStringify from 'rehype-stringify';

import toml from '@iarna/toml';

import * as unifiedProcessors from './unifiedProcessors.js';

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
            .use(remarkLintMaximumLineLength, false) // Directives can be longer

            // remark
            .use(remarkParse)
            .use(remarkRemoveComments)
            .use(remarkFrontmatter, { type: 'toml', marker: '-' })
            .use(remarkExtractFrontmatter, { name: 'frontmatter', toml: toml.parse })
            .use(unifiedProcessors.remarkCheckFrontmatter, this.#citationOptions)
            .use(remarkGfm)
            .use(remarkDirective)
            .use(remarkProcessDirectives, this)
            .use(remarkSmartypants, { dashes: 'oldschool' })
            .use(remarkGemoji)
            .use(remarkA11yEmoji)
            .use(remarkMath, { singleDollarTextMath: false })
            .use(remarkRehype, { allowDangerousHtml: true })

            // rehype
            .use(unifiedProcessors.rehypeTransformIrisLinks, this)
            .use(unifiedProcessors.rehypeExternalLinkHandler)
            .use(rehypeCitation, this.#citationOptions)
            .use(unifiedProcessors.rehypeAddReferencesHeading)
            .use(rehypeSlug)
            .use(rehypeKatex, {
                macros: {
                    '\\vect': '\\mathbf{#1}',
                    '\\uveci': '\\mathbf{\\hat{\\textbf{\\i}}}',
                    '\\uvecj': '\\mathbf{\\hat{\\textbf{\\j}}}',
                    '\\uveck': '\\mathbf{\\hat{k}}'
                }
            })
            .use(unifiedProcessors.rehypeExtractToc)
            .use(rehypeAutolinkHeadings, {
                content: {
                    type: 'element',
                    tagName: 'span',
                    properties: {
                        className: ['anchor-link'],
                    },
                },
            })
            .use(rehypeStarryNight, {
                headerExtensions: [
                    starryNightLanguageExtension,
                    starryNightCaptionExtension,
                    // https://github.com/Microflash/rehype-starry-night
                    (headerOptions, children) => {
                        children.push({
                            type: 'element',
                            tagName: 'button',
                            properties: {
                                className: ['highlight-copy'],
                                for: headerOptions.id,
                            },
                            children: [
                                {
                                    type: 'text',
                                    value: 'Copy'
                                }
                            ],
                        });
                    }
                ]
            })
            .use(unifiedProcessors.rehypeImageLazyLoading)
            .use(rehypePresetMinify)
            .use(rehypeStringify, { allowDangerousHtml: true });
    }

    set bibliography(bib) {
        this.#citationOptions.bibliography = bib;
    }

    render(input) {
        return this.#processor.process(input);
    }
}

import { unified } from 'unified'

import remarkPresetLintRecommended from 'remark-preset-lint-recommended'
import remarkPresetLintMarkdownStyleGuide from 'remark-preset-lint-markdown-style-guide'
import remarkLintListItemSpacing from 'remark-lint-list-item-spacing'
import remarkLintMaximumLineLength from 'remark-lint-maximum-line-length'

import remarkParse from 'remark-parse'
import remarkRemoveComments from 'remark-remove-comments'
import remarkFrontmatter from 'remark-frontmatter'
import remarkExtractFrontmatter from 'remark-extract-frontmatter'
import remarkGfm from 'remark-gfm'
import remarkDirective from 'remark-directive'
import remarkProcessDirectives from './directives.js'
import remarkSmartypants from 'remark-smartypants'
import remarkGemoji from 'remark-gemoji'
import remarkA11yEmoji from '@fec/remark-a11y-emoji'
import remarkMath from 'remark-math'
import remarkRehype from 'remark-rehype'

import rehypeCitation from 'rehype-citation'
import rehypeSlug from 'rehype-slug'
import rehypeKatex from 'rehype-katex'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypePresetMinify from 'rehype-preset-minify'
import rehypeStringify from 'rehype-stringify'

import toml from '@iarna/toml'
import * as unifiedProcessors from './unifiedProcessors.js'

export default class MarkdownRenderer {
  filePath
  fileContents
  config

  #processor
  #citationOptions = {
    linkCitations: true,
    inlineClass: ['citation']
  }

  constructor () {
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
      .use(unifiedProcessors.remarkSetNoCite, this.#citationOptions)
      .use(remarkGfm)
      .use(remarkDirective)
      .use(remarkProcessDirectives, this)
      .use(remarkSmartypants, { dashes: 'oldschool' })
      .use(remarkGemoji)
      .use(remarkA11yEmoji)
      .use(remarkMath, { singleDollarTextMath: false })
      .use(remarkRehype, { allowDangerousHtml: true })
      .use(unifiedProcessors.remarkLanguageTool, this)

      // rehype
      .use(unifiedProcessors.rehypeTransformLinks, this)
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
            className: ['anchor-link']
          }
        }
      })
      .use(unifiedProcessors.rehypeImageLazyLoading)
      .use(rehypePresetMinify)
      .use(rehypeStringify, { allowDangerousHtml: true })
  }

  /**
    * Renders the given input, given a path to an optional bibliography file
    * and the path to the file relative to the project root.
    */
  render ({ filePath, input, config, bibliography }) {
    this.filePath = filePath
    this.fileContents = input
    this.config = config
    this.#citationOptions.bibliography = bibliography
    return this.#processor.process(input)
  }
}

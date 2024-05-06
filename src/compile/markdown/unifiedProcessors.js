import { visit } from 'unist-util-visit'
import { headingRank } from 'hast-util-heading-rank'
import { toHtml } from 'hast-util-to-html'
import { select } from 'hast-util-select'
import { VFile } from 'vfile'
import { location } from 'vfile-location'
import { compose as composeAnnotated, defaults as annotationDefaultOptions } from 'annotatedtext'
import { vfileMessage, resolveInternalLink, internalLinkToPageLink, internalLinkToAssetTag, langtoolCheck } from '../../utils.js'

// Expects the same options as rehype-citation
export function remarkSetNoCite (opts) {
  return async (_, file) => {
    const frontmatter = file.data.frontmatter

    if (frontmatter) { opts.noCite = frontmatter.cite }
  }
}

// Expects MarkdownRenderer as opts
export function remarkLanguageTool (opts) {
  return async (tree, file) => {
    const annotated = composeAnnotated(opts.fileContents.toString(), tree, Object.assign(annotationDefaultOptions, {
      // Based on:
      // - https://github.com/prosegrinder/annotatedtext/blob/main/src/index.ts
      // - https://github.com/prosegrinder/annotatedtext-remark/blob/main/src/index.ts
      // Copyright (c) 2018 David L. Day, MIT License
      annotatetextnode (node, text) {
        if (node.type === 'text' && node.position) {
          return {
            offset: {
              end: node.position.end.offset,
              start: node.position.start.offset
            },
            text: text.substring(
              node.position.start.offset,
              node.position.end.offset
            ).replace(/\n/g, ' ')
          }
        } else {
          return null
        }
      },
      interpretmarkup (text) {
        return '\n'.repeat(Math.min(2, (text.match(/\n/g) || []).length))
      }
    }))

    const checkResponse = await langtoolCheck(opts.config.markdown.languagetool, { language: 'en-US', data: JSON.stringify(annotated) })
    if (checkResponse.status !== 200) { vfileMessage(file, null, 'langtool-failed', 'LanguageTool check failed') }

    // https://languagetool.org/http-api/swagger-ui/#!/default/post_check
    const result = await checkResponse.json()
    if (!result.matches) { return }

    const place = location(new VFile(opts.fileContents))

    for (const match of result.matches) {
      const start = place.toPoint(match.offset)
      const end = place.toPoint(match.offset + match.length)

      const msg = file.message(match.message, {
        source: 'languagetool',
        place: {
          start,
          end
        },
        ruleId: match.rule && match.rule.id
      })

      msg.name = `${start.line}:${start.column}-${end.line}:${end.column}`
      msg.replacements = match.replacements
      msg.rule = match.rule
    }
  }
}

export function rehypeAddReferencesHeading () {
  return tree => {
    const references = select('div.references', tree)
    if (!references) { return }

    references.children.unshift({
      type: 'element',
      tagName: 'h2',
      properties: {},
      children: [
        {
          type: 'text',
          value: 'References'
        }
      ]
    })
  }
}

// Expects MarkdownRenderer (filePath) as opts
export function rehypeTransformLinks (opts) {
  return (tree, file) => {
    visit(tree, node => {
      if (node.type !== 'element') { return }

      const assetTags = {
        img: 'src'
      }

      if (node.tagName === 'a') {
        const href = node.properties.href
        if (!href) { return }

        const internalLink = resolveInternalLink(href, opts.filePath)
        if (internalLink) {
          const links = file.data.links || (file.data.links = [])
          const hashSplit = internalLink.slice(1).split('#')
          if (hashSplit.length > 1) { links.push(hashSplit.slice(0, -1).join('#')) } else { links.push(hashSplit[0]) }

          node.properties.href = internalLinkToPageLink(internalLink)
        }
      } else if (assetTags[node.tagName]) {
        // Replace asset links to make handling with web frameworks easier
        const linkProperty = assetTags[node.tagName]
        const link = node.properties[linkProperty]
        if (!link) { return }

        const internalLink = resolveInternalLink(link, opts.filePath)
        if (internalLink) {
          const assetTag = internalLinkToAssetTag(internalLink)
          node.properties[linkProperty] = `####${assetTag}####`

          const assets = file.data.assets || (file.data.assets = {})
          assets[assetTag] = internalLink
        }
      }
    })
  }
}

export function rehypeExternalLinkHandler () {
  return tree => {
    visit(tree, node => {
      if (node.type !== 'element' || node.tagName !== 'a') { return }

      const href = node.properties.href

      try {
        // eslint-disable-next-line no-new
        new URL(href)
        const className = node.properties.className || (node.properties.className = [])
        className.push('external')
      } catch {
        // Nothing
      }
    })
  }
}

export function rehypeImageLazyLoading () {
  return tree => {
    visit(tree, node => {
      if (node.type !== 'element' || node.tagName !== 'img') { return }

      node.properties.loading = 'lazy'
    })
  }
}

export function rehypeExtractToc () {
  return (tree, file) => {
    const toc = []
    const currentStack = []

    visit(tree, node => {
      const rank = headingRank(node)
      if (!rank) { return }

      const heading = {
        rank,
        data: {
          id: node.properties.id,
          value: toHtml(node.children)
        }
      }

      while (currentStack.length && currentStack.at(-1).rank >= rank) {
        currentStack.pop()
      }

      if (currentStack.length) {
        const children = currentStack.at(-1).data.children || (currentStack.at(-1).data.children = [])
        children.push(heading.data)
      } else {
        toc.push(heading.data)
      }

      currentStack.push(heading)
    })

    file.data.toc = toc
  }
}

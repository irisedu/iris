import fs from 'fs-extra'
import path from 'path'
import FlexSearch from 'flexsearch'
import { convert as htmlToText } from 'html-to-text'
import { recurseDirectory } from '../utils.js'
import CollectionProcessor from './CollectionProcessor.js'

export default class SearchIndexCollectionProcessor extends CollectionProcessor {
  async process ({ outDir, handledFiles }) {
    const searchIndexOpts = {
      tokenize: 'forward',
      document: {
        id: 'id',
        index: ['contents'].concat(this.config.flexsearch.index),
        store: true
      }
    }

    const doc = new FlexSearch.Document(searchIndexOpts)
    const articleExt = '.md.json'

    await recurseDirectory(outDir, async filePath => {
      if (!filePath.endsWith('.md.json')) { return }

      const articleData = JSON.parse(await fs.readFile(path.join(outDir, filePath)))
      const id = filePath.slice(0, -articleExt.length)

      const document = {
        id,
        contents: htmlToText(articleData.contents, {
          wordwrap: false,
          selectors: [
            { selector: 'img', format: 'skip' },
            { selector: '.katex-mathml', format: 'skip' },
            { selector: 'table', format: 'skip' } // Not formatted correctly
          ]
        }),
        href: `/page/${id}`
      }

      for (const key of this.config.flexsearch.store) {
        document[key] = articleData.data.frontmatter[key]
      }

      doc.add(document)
    })

    const index = {}

    await doc.export((key, data) => {
      index[key] = data
    })

    const optsPath = path.join(outDir, 'searchIndexOpts.json')
    const indexPath = path.join(outDir, 'searchIndex.json')

    await fs.writeFile(optsPath, JSON.stringify(searchIndexOpts))
    await fs.writeFile(indexPath, JSON.stringify(index))

    // Prevent garbage collection
    handledFiles[optsPath] = true
    handledFiles[indexPath] = true
  }
}

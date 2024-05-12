import fs from 'fs-extra'
import path from 'path'
import { convert as htmlToText } from 'html-to-text'
import { recurseDirectory, shouldBuild } from '../utils.js'
import CollectionProcessor from './CollectionProcessor.js'
import MarkdownFileProcessor from '../compile/markdown/MarkdownFileProcessor.js'

const msgsExt = '.msgs'
const textExt = '.txt'

export default class MarkdownAuxCollectionProcessor extends CollectionProcessor {
  async process ({ outDir, vfiles, handledFiles }) {
    await recurseDirectory(outDir, async filePath => {
      if (!filePath.endsWith('.md.json')) { return }

      const fullPath = path.join(outDir, filePath)

      // Prevent garbage collection
      if (!await shouldBuild(fullPath, fullPath + msgsExt)) {
        handledFiles[fullPath + msgsExt] = true
      }

      if (!await shouldBuild(fullPath, fullPath + textExt)) {
        handledFiles[fullPath + textExt] = true
      }
    })

    for (const vf of vfiles) {
      if (!vf.path.endsWith('.md')) { continue }

      const outPath = path.join(outDir, MarkdownFileProcessor.getOutputPath(vf.path))

      const textContents = htmlToText(vf.value, {
        wordwrap: false,
        selectors: [
          { selector: 'img', format: 'skip' },
          { selector: '.katex-mathml', format: 'skip' },
          { selector: 'table', format: 'skip' } // Not formatted correctly
        ]
      })

      await fs.writeFile(outPath + textExt, textContents)
      handledFiles[outPath + textExt] = true // Prevent garbage collection

      if (vf.messages && vf.messages.length) {
        const messages = vf.messages.map(msg => {
          const newMsg = { ...msg }
          delete newMsg.ancestors
          return newMsg
        })

        await fs.writeFile(outPath + msgsExt, JSON.stringify(messages))
        handledFiles[outPath + msgsExt] = true // Prevent garbage collection
      }
    }
  }
}

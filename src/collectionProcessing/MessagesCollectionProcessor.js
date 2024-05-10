import fs from 'fs-extra'
import path from 'path'
import { recurseDirectory, shouldBuild } from '../utils.js'
import CollectionProcessor from './CollectionProcessor.js'
import MarkdownFileProcessor from '../compile/markdown/MarkdownFileProcessor.js'

export default class MessagesCollectionProcessor extends CollectionProcessor {
  async process ({ outDir, vfiles, handledFiles }) {
    await recurseDirectory(outDir, async filePath => {
      if (!filePath.endsWith('.md.json')) { return }

      const fullPath = path.join(outDir, filePath)

      if (!await shouldBuild(fullPath, fullPath + '.msgs')) {
        handledFiles[fullPath + '.msgs'] = true // Prevent garbage collection
      }
    })

    for (const vf of vfiles) {
      if (!vf.path.endsWith('.md')) { continue }

      const outPath = path.join(outDir, MarkdownFileProcessor.getOutputPath(vf.path) + '.msgs')

      if (vf.messages && vf.messages.length) {
        const messages = vf.messages.map(msg => {
          const newMsg = { ...msg }
          delete newMsg.ancestors
          return newMsg
        })

        await fs.writeFile(outPath, JSON.stringify(messages))
        handledFiles[outPath] = true // Prevent garbage collection
      }
    }
  }
}

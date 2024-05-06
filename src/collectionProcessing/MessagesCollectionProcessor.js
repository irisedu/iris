import fs from 'fs-extra'
import path from 'path'
import CollectionProcessor from './CollectionProcessor.js'
import MarkdownFileProcessor from '../compile/markdown/MarkdownFileProcessor.js'

export default class MessagesCollectionProcessor extends CollectionProcessor {
  async process ({ outDir, vfiles }) {
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
      } else {
        await fs.rm(outPath, { force: true })
      }
    }
  }
}

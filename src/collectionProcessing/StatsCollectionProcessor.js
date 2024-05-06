import fs from 'fs-extra'
import path from 'path'
import { recurseDirectory } from '../utils.js'
import CollectionProcessor from './CollectionProcessor.js'

export default class StatsCollectionProcessor extends CollectionProcessor {
  async process ({ outDir }) {
    const stats = {
      articleCount: 0,
      stubs: []
    }

    const articleExt = '.md.json'

    await recurseDirectory(outDir, async filePath => {
      if (!filePath.endsWith(articleExt)) { return }

      stats.articleCount++

      const articleData = JSON.parse(await fs.readFile(path.join(outDir, filePath)))
      if (!articleData.contents.length) {
        stats.stubs.push({
          title: articleData.data.frontmatter.title,
          href: `/page/${filePath.slice(0, -articleExt.length)}`
        })
      }
    })

    await fs.writeFile(path.join(outDir, 'stats.json'), JSON.stringify(stats))
  }
}

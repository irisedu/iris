import fs from 'fs-extra'
import path from 'path'
import { recurseDirectory } from '../utils.js'
import CollectionProcessor from './CollectionProcessor.js'

export default class NetworkCollectionProcessor extends CollectionProcessor {
  async process ({ outDir }) {
    const network = {
      nodes: [],
      links: []
    }

    const backlinks = {}

    await recurseDirectory(outDir, async filePath => {
      const articleExt = '.md.json'

      if (!filePath.endsWith(articleExt)) { return }

      const id = filePath.slice(0, -articleExt.length)
      const articleData = JSON.parse(await fs.readFile(path.join(outDir, filePath)))

      const node = {
        id,
        href: `/page/${id}`
      }

      for (const key of this.config.network.store) {
        node[key] = articleData.data.frontmatter[key]
      }

      network.nodes.push(node)

      if (articleData.data.links) {
        for (const otherId of articleData.data.links) {
          const links = backlinks[otherId] || (backlinks[otherId] = [])
          links.push(id)

          if (network.links.some(l => (l.from === id && l.to === otherId) || (l.from === otherId && l.to === id))) { continue }

          network.links.push({
            source: id,
            target: otherId
          })
        }
      }
    })

    await fs.writeFile(path.join(outDir, 'network.json'), JSON.stringify(network))
    await fs.writeFile(path.join(outDir, 'backlinks.json'), JSON.stringify(backlinks))
  }
}

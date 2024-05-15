import signale from 'signale'
import fs from 'fs-extra'
import path from 'path'
import CollectionProcessor from '../collectionProcessing/CollectionProcessor.js'

export default class SeriesCollectionProcessor extends CollectionProcessor {
  async process ({ outDir, handledFiles }) {
    const series = []

    const directory = await fs.readdir(outDir, { withFileTypes: true })

    for (const dirent of directory) {
      if (!dirent.isDirectory()) { continue }

      const summaryPath = path.join(outDir, dirent.name, 'SUMMARY.md.json')
      if (!await fs.exists(summaryPath)) { continue }

      const summaryData = JSON.parse(await fs.readFile(summaryPath))

      if (!summaryData.data.summary) {
        signale.warn(`[Iris] Series '${dirent.name}' has no summary directive`)
      }

      const frontmatter = summaryData.data.frontmatter
      if (!frontmatter) { continue }

      series.push({
        title: frontmatter.title,
        authors: frontmatter.authors,
        tags: frontmatter.tags,
        href: `/page/${dirent.name}`
      })
    }

    const outPath = path.join(outDir, 'series.json')
    await fs.writeFile(outPath, JSON.stringify(series))
    handledFiles[outPath] = true // Prevent garbage collection
  }
}

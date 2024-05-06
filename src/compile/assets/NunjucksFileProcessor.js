import fs from 'fs-extra'
import path from 'path'
import { VFile } from 'vfile'
import nunjucks from 'nunjucks'
import FileProcessor from '../../FileProcessor.js'
import { vfileMessage } from '../../utils.js'

export default class NunjucksFileProcessor extends FileProcessor {
  async process ({ inDir, outDir, filePath }) {
    const inPath = path.join(inDir, filePath)
    const outPath = path.join(outDir, NunjucksFileProcessor.getOutputPath(filePath))

    const vfile = new VFile({ path: filePath })

    const njkBase = path.join(inDir, this.config.nunjucks.templatePath)
    const env = nunjucks.configure(njkBase, {
      autoescape: false
    })

    // https://github.com/mozilla/nunjucks/issues/788#issuecomment-332183033
    env.addGlobal('includeRaw', src => {
      let filePath

      if (src.startsWith('.')) {
        filePath = path.join(path.dirname(inPath), src)
      } else {
        filePath = path.join(njkBase, src)
      }

      return fs.readFileSync(filePath)
    })

    const contents = await fs.readFile(inPath, 'utf-8')

    try {
      const res = nunjucks.renderString(contents)
      await fs.writeFile(outPath, res)
    } catch (e) {
      vfileMessage(vfile, null, 'njk-compile', 'Failed to compile Nunjucks file: ' + e.message)
    }

    return vfile
  }

  handlesFile (filePath) {
    return filePath.endsWith('.njk')
  }

  static getOutputPath (filePath) {
    return filePath.slice(0, -4) + '.html'
  }
}

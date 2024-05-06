import fs from 'fs-extra'
import path from 'path'
import { execFile as execFileCb } from 'node:child_process'
import util from 'node:util'
import { VFile } from 'vfile'
import FileProcessor from '../../FileProcessor.js'
import { vfileMessage } from '../../utils.js'

const execFile = util.promisify(execFileCb)

export default class TeXFileProcessor extends FileProcessor {
  async process ({ inDir, outDir, filePath }) {
    const inPath = path.join(inDir, filePath)
    const outPath = path.join(outDir, filePath)

    const vfile = new VFile({ path: filePath })

    const inPathParsed = path.parse(inPath)
    const cwd = inPathParsed.dir

    const outParent = path.dirname(outPath)

    try {
      await execFile('latex', [inPathParsed.name], { cwd })
      const outSpec = path.join(outParent, '%f.svg')

      try {
        await fs.ensureDir(outParent)
        await execFile('dvisvgm', [inPathParsed.name, '--no-fonts', '-o', outSpec], { cwd })
      } catch {
        vfileMessage(vfile, null, 'latex-compile', 'Failed to convert LaTeX to SVG')
      }
    } catch {
      vfileMessage(vfile, null, 'latex-compile', 'LaTeX failed to compile')
    }

    return vfile
  }

  handlesFile (filePath) {
    return filePath.endsWith('.tex')
  }

  static getOutputPath (filePath) {
    return filePath.slice(0, -4) + '.svg'
  }
}

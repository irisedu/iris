import fs from 'fs-extra'
import path from 'path'
import { validate } from '@hyperjump/json-schema/draft-2020-12'
import CollectionProcessor from './CollectionProcessor.js'
import MarkdownFileProcessor from '../compile/markdown/MarkdownFileProcessor.js'
import TomlFileProcessor from '../compile/TomlFileProcessor.js'
import { vfileMessage } from '../utils.js'

export default class SchemaCollectionProcessor extends CollectionProcessor {
  async process ({ inDir, outDir, vfiles }) {
    for (const vf of vfiles) {
      let obj
      let schemaPath
      let msg

      if (vf.path.endsWith('.toml')) {
        schemaPath = this.config.schemas[path.basename(vf.path)]
        if (!schemaPath) { continue }

        obj = JSON.parse(await fs.readFile(path.join(outDir, TomlFileProcessor.getOutputPath(vf.path))))
        msg = 'File violates schema'
      } else if (vf.path.endsWith('.md')) {
        schemaPath = this.config.schemas.FRONTMATTER
        if (!schemaPath) { continue }

        const articleData = JSON.parse(await fs.readFile(path.join(outDir, MarkdownFileProcessor.getOutputPath(vf.path))))
        obj = articleData.data.frontmatter
        msg = 'Frontmatter violates schema'
      } else {
        continue
      }

      const validateResult = await validate(path.join(inDir, schemaPath), obj)

      if (!validateResult.valid) {
        vfileMessage(vf, null, 'schema-validate', msg)
      }
    }
  }
}

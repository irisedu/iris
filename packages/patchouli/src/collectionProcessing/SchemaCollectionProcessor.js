import fs from 'fs-extra';
import path from 'path';
import anymatch from 'anymatch';
import { validate } from '@hyperjump/json-schema/draft-2020-12';
import CollectionProcessor from './CollectionProcessor.js';
import MarkdownFileProcessor from '../compile/markdown/MarkdownFileProcessor.js';
import TomlFileProcessor from '../compile/TomlFileProcessor.js';
import { vfileMessage } from '../utils.js';

export default class SchemaCollectionProcessor extends CollectionProcessor {
	async process({ outDir, vfiles }) {
		for (const vf of vfiles) {
			let obj;
			let schemaUri;
			let msg;

			if (vf.path.endsWith('.toml')) {
				for (const [key, schema] of Object.entries(
					this.config.platform.schemas
				)) {
					if (!anymatch(key, vf.path)) {
						continue;
					}

					schemaUri = schema;
					break;
				}

				if (!schemaUri) {
					continue;
				}

				obj = JSON.parse(
					await fs.readFile(
						path.join(outDir, TomlFileProcessor.getOutputPath(vf.path))
					)
				);
				msg = 'File violates schema';
			} else if (vf.path.endsWith('.md')) {
				schemaUri = this.config.platform.schemas.FRONTMATTER;
				if (!schemaUri) {
					continue;
				}

				const articleData = JSON.parse(
					await fs.readFile(
						path.join(outDir, MarkdownFileProcessor.getOutputPath(vf.path))
					)
				);
				obj = articleData.data.frontmatter;
				msg = 'Frontmatter violates schema';
			} else {
				continue;
			}

			const validateResult = await validate(schemaUri, obj);

			if (!validateResult.valid) {
				vfileMessage(vf, null, 'schema-validate', msg);
			}
		}
	}
}

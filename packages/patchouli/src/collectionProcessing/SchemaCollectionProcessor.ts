import fs from 'fs-extra';
import path from 'path';
import anymatch from 'anymatch';
import { validate } from '@hyperjump/json-schema/draft-2020-12';
import MarkdownFileProcessor from '../compile/markdown/MarkdownFileProcessor';
import TomlFileProcessor from '../compile/TomlFileProcessor';
import CollectionProcessor, {
	type CollectionProcessorArgs
} from './CollectionProcessor';

export default class SchemaCollectionProcessor extends CollectionProcessor {
	override async process({ outDir, fileInfo }: CollectionProcessorArgs) {
		for (const fi of fileInfo) {
			let obj;
			let schemaUri;
			let msg;

			if (fi.path.endsWith('.toml')) {
				for (const [key, schema] of Object.entries(
					this.config.platform.schemas
				)) {
					if (!anymatch(key, fi.path)) {
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
						path.join(outDir, TomlFileProcessor.getOutputPath(fi.path)),
						'utf-8'
					)
				);
				msg = 'File violates schema';
			} else if (fi.path.endsWith('.md')) {
				schemaUri = this.config.platform.schemas.FRONTMATTER;
				if (!schemaUri) {
					continue;
				}

				const articleData = JSON.parse(
					await fs.readFile(
						path.join(outDir, MarkdownFileProcessor.getOutputPath(fi.path)),
						'utf-8'
					)
				);
				obj = articleData.data.frontmatter;
				msg = 'Frontmatter violates schema';
			} else {
				continue;
			}

			const validateResult = await validate(schemaUri, obj);

			if (!validateResult.valid) {
				fi.message({ id: 'schema-validate', message: msg });
			}
		}
	}
}

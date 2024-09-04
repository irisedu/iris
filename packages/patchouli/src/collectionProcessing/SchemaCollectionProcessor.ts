import fs from 'fs-extra';
import { posix as path } from 'path';
import anymatch from 'anymatch';
import type { Json } from '@hyperjump/json-pointer';
import { validate } from '@hyperjump/json-schema/draft-2020-12';
import TomlFileProcessor from '../compile/TomlFileProcessor';
import CollectionProcessor, {
	type CollectionProcessorArgs
} from './CollectionProcessor';

export default class SchemaCollectionProcessor extends CollectionProcessor {
	override async process({ inDir, outDir, fileInfo }: CollectionProcessorArgs) {
		for (const fi of fileInfo) {
			let obj: Json;
			let msg: string;
			let schemaUri: string | undefined;

			for (const [key, schema] of Object.entries(this.config.schemas)) {
				if (!anymatch(key, fi.path)) {
					continue;
				}

				schemaUri = 'file://' + path.join(inDir, schema);
				break;
			}

			if (!schemaUri) {
				continue;
			}

			if (fi.path.endsWith('.toml')) {
				obj = JSON.parse(
					await fs.readFile(
						path.join(outDir, TomlFileProcessor.getOutputPath(fi.path)),
						'utf-8'
					)
				);

				msg = 'File violates schema';
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

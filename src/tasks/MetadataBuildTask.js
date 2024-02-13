import signale from 'signale';
import toml from '@iarna/toml';
import { validate } from '@hyperjump/json-schema/draft-2020-12';
import path from 'path';
import fs from 'fs-extra';
import { VFile } from 'vfile';

import BuildTask from './BuildTask.js';
import { vfileMessage, shouldBuild } from '../utils.js';

export default class MetadataBuildTask extends BuildTask {
    #inPath;
    #outPath;
    #schema;
    #outKey;

    constructor(inPath, outPath, schema, outKey) {
        super();
        this.#inPath = inPath;
        this.#outPath = outPath;
        this.#schema = schema;
        this.#outKey = outKey;
    }

    async build() {
        const vfile = new VFile({ path: this.#inPath });
        const doBuild = await shouldBuild(this.#inPath, this.#outPath);

        // Read from output if up to date
        if (!doBuild) {
            signale.complete(`Skipping metadata ${this.#inPath} (cached)`);

            const parsed = JSON.parse(await fs.readFile(this.#outPath));
            if (this.#outKey) {
                vfile.data.parsed = {};
                vfile.data.parsed[this.#outKey] = parsed;
            } else {
                vfile.data.parsed = parsed;
            }

            return vfile;
        }

        signale.await(`Building metadata file at ${this.#inPath}...`);

        // Read and parse
        try {
            vfile.value = await fs.readFile(this.#inPath, 'utf-8');
        } catch (e) {
            vfileMessage(vfile, null, 'toml-not-found', `Failed to read file: ${e.toString()}`);
            return vfile;
        }

        let tomlParsed;

        try {
            tomlParsed = toml.parse(vfile.value);
        } catch (e) {
            vfileMessage(vfile, null, 'toml-invalid', `Failed to parse file: ${e.toString()}`);
            return vfile;
        }

        // Schema validation
        const validateResult = await validate(path.join(import.meta.dirname, '../../schemas', this.#schema), tomlParsed);
        if (validateResult.valid) {
            vfile.data.parsed = tomlParsed;

            await fs.ensureDir(path.dirname(this.#outPath));
            await fs.writeFile(this.#outPath, JSON.stringify(this.#outKey ? tomlParsed[this.#outKey] : tomlParsed));
        } else {
            vfileMessage(vfile, null, 'toml-schema', 'File violates schema');
        }

        return vfile;
    }
}

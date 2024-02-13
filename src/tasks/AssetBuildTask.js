import signale from 'signale';
import fs from 'fs-extra';
import path from 'path';

import BuildTask from './BuildTask.js';
import { shouldBuild } from '../utils.js';

export default class AssetBuildTask extends BuildTask {
    #inPath;
    #outPath;

    constructor(inPath, outPath) {
        super();
        this.#inPath = inPath;
        this.#outPath = outPath;
    }

    async build() {
        const doBuild = await shouldBuild(this.#inPath, this.#outPath);
        if (!doBuild) {
            signale.complete(`Skipping asset ${this.#inPath} (cached)`);
            return;
        }

        signale.await(`Building asset at ${this.#inPath}...`);

        await fs.ensureDir(path.dirname(this.#outPath));
        await fs.copyFile(this.#inPath, this.#outPath);
    }
}

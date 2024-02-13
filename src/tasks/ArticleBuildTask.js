import signale from 'signale';
import fs from 'fs-extra';
import path from 'path';

import BuildTask from './BuildTask.js';
import { vfileMessage, shouldBuild } from '../utils.js';

export default class ArticleBuildTask extends BuildTask {
    #inPath;
    #outPath;
    #renderer;
    #seriesToml;

    constructor(inPath, outPath, renderer, seriesToml) {
        super();

        this.#inPath = inPath;
        this.#outPath = outPath;
        this.#renderer = renderer;
        this.#seriesToml = seriesToml;
    }

    async build() {
        const doBuild = await shouldBuild(this.#inPath, this.#outPath);
        if (!doBuild) {
            signale.complete(`Skipping article ${this.#inPath} (cached)`);
            return;
        }

        signale.await(`Building article at ${this.#inPath}...`);

        let contents;

        try {
            contents = await fs.readFile(this.#inPath);
        } catch {
            vfileMessage(this.#seriesToml, null, 'article-not-found', `Article not found at ${this.#inPath}`);
            return;
        }

        const vfile = await this.#renderer.render(contents);
        vfile.path = this.#inPath;

        await fs.ensureDir(path.dirname(this.#outPath));
        await fs.writeFile(this.#outPath, JSON.stringify({
            data: vfile.data,
            contents: vfile.value
        }));

        return vfile;
    }
}

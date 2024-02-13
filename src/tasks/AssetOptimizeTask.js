import signale from 'signale';
import path from 'path';
import fs from 'fs-extra';
import { optimize as svgoOptimize } from 'svgo';
import minifyHtml from '@minify-html/node';

import BuildTask from './BuildTask.js';

export default class AssetOptimizeTask extends BuildTask {
    #inPath;

    constructor(inPath) {
        super();
        this.#inPath = inPath;
    }

    async #optimizeSvg() {
        signale.await(`Optimizing SVG ${this.#inPath}...`);

        const contents = await fs.readFile(this.#inPath);
        const optimizeResult = svgoOptimize(contents, {
            path: this.#inPath,
            multipass: true
        });

        await fs.writeFile(this.#inPath, optimizeResult.data);
    }

    async #minifyHtml() {
        signale.await(`Minifying HTML ${this.#inPath}...`);

        const contents = await fs.readFile(this.#inPath);
        const minified = minifyHtml.minify(contents, {
            keep_spaces_between_attributes: false,
            minify_css: true
        });

        await fs.writeFile(this.#inPath, minified);
    }

    async build() {
        switch (path.extname(this.#inPath)) {
        case '.svg':
            await this.#optimizeSvg();
            break;
        case '.html':
            await this.#minifyHtml();
            break;
        }
    }
}

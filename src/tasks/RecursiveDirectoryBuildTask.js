import signale from 'signale';
import fs from 'fs-extra';
import path from 'path';

import TaskRunner from './TaskRunner.js';
import BuildTask from './BuildTask.js';
import { recurseDirectory } from '../utils.js';

export default class RecursiveDirectoryBuildTask extends BuildTask {
    #inDir;
    #outDir;

    constructor(inDir, outDir) {
        super();
        this.#inDir = inDir;
        this.#outDir = outDir;
    }

    async build() {
        if (!(await fs.exists(this.#inDir))) {
            await fs.rmdir(this.#outDir).catch(() => {});
            return;
        }

        const taskRunner = new TaskRunner();
        const outPaths = [];

        await recurseDirectory(this.#inDir, async filePath => {
            const inPath = path.join(this.#inDir, filePath);
            const outPath = path.join(this.#outDir, filePath);

            const newOutPath = await this.addPath(inPath, outPath, taskRunner);
            outPaths.push(newOutPath);
        });

        await recurseDirectory(this.#outDir, async filePath => {
            const absPath = path.join(this.#outDir, filePath);
            if (!outPaths.includes(absPath)) {
                signale.note(`Removing outdated file ${absPath}...`);
                await fs.rm(absPath);
            }
        }).catch(() => {});

        return await taskRunner.run();
    }

    // eslint-disable-next-line no-unused-vars
    async addPath(inPath, outPath, taskRunner) {
        return outPath;
    }
}

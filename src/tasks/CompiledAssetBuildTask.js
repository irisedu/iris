import signale from 'signale';
import fs from 'fs-extra';
import path from 'path';
import { VFile } from 'vfile';
import util from 'node:util';
import { execFile as execFileCb } from 'node:child_process';
import nunjucks from 'nunjucks';

import BuildTask from './BuildTask.js';
import AssetOptimizeTask from './AssetOptimizeTask.js';
import { vfileMessage, shouldBuild } from '../utils.js';

const execFile = util.promisify(execFileCb);

export default class CompiledAssetBuildTask extends BuildTask {
    #inPath;
    #outPath;

    constructor(inPath, outPath) {
        super();
        this.#inPath = inPath;
        this.#outPath = outPath;
    }

    async #buildTeX(vfile) {
        const inPathParsed = path.parse(this.#inPath);
        const cwd = inPathParsed.dir;

        const outDir = path.dirname(this.#outPath);

        try {
            await execFile('latex', [inPathParsed.name], { cwd });
            const outSpec = path.join(outDir, '%f.svg');

            try {
                await fs.ensureDir(outDir);
                await execFile('dvisvgm', [inPathParsed.name, '--no-fonts', '-o', outSpec], { cwd });
            } catch {
                vfileMessage(vfile, null, 'latex-compile', 'Failed to convert LaTeX to SVG');
            }
        } catch {
            vfileMessage(vfile, null, 'latex-compile', 'LaTeX failed to compile');
        }
    }

    async #buildNjk(vfile) {
        const njkBase = path.join(import.meta.dirname, '../../njk-templates');
        const env = nunjucks.configure(njkBase, {
            autoescape: false
        });

        // https://github.com/mozilla/nunjucks/issues/788#issuecomment-332183033
        env.addGlobal('includeRaw', src => {
            let filePath;

            if (src.startsWith('.')) {
                filePath = path.join(path.dirname(this.#inPath), src);
            } else {
                filePath = path.join(njkBase, src);
            }

            return fs.readFileSync(filePath);
        });

        const contents = await fs.readFile(this.#inPath, 'utf-8');

        try {
            const res = nunjucks.renderString(contents);
            await fs.writeFile(this.#outPath, res);
        } catch {
            vfileMessage(vfile, null, 'njk-compile', 'Failed to compile Nunjucks file');
        }
    }

    async build() {
        const doBuild = await shouldBuild(this.#inPath, this.#outPath);
        if (!doBuild) {
            signale.complete(`Skipping compiled asset ${this.#inPath} (cached)`);
            return;
        }

        const vfile = new VFile({ path: this.#inPath });

        let task;

        switch (path.extname(this.#inPath)) {
        case '.tex':
            task = this.#buildTeX(vfile);
            break;

        case '.njk':
            task = this.#buildNjk(vfile);
            break;
        }

        if (!task)
            return;

        signale.await(`Building compiled asset at ${this.#inPath}...`);
        await task;

        const optimizeTask = new AssetOptimizeTask(this.#outPath);
        await optimizeTask.build();

        return vfile;
    }

    static resolveCompiledPath(filePath) {
        if (filePath.endsWith('.tex')) {
            return filePath.slice(0, -4) + '.svg';
        }

        if (filePath.endsWith('.njk')) {
            return filePath.slice(0, -4) + '.html';
        }

        return filePath;
    }
}

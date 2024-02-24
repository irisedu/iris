import signale from 'signale';
import fs from 'fs-extra';
import path from 'path';
import { recurseDirectory } from '../utils.js';

import BuildTask from './BuildTask.js';

export default class StatsBuildTask extends BuildTask {
    #buildPath;

    constructor(buildPath) {
        super();
        this.#buildPath = buildPath;
    }

    async build() {
        signale.await('Building statistics data...');

        const stats = {
            articleCount: 0,
            stubs: [],
        };

        const articleExt = '.md.json';

        await recurseDirectory(this.#buildPath, async filePath => {
            if (!filePath.endsWith(articleExt))
                return;

            stats.articleCount++;

            const articleData = JSON.parse(await fs.readFile(path.join(this.#buildPath, filePath)));
            if (!articleData.contents.length)
                stats.stubs.push({
                    title: articleData.data.frontmatter.title,
                    href: `/series/${filePath.slice(0, -articleExt.length)}`
                });
        });

        await fs.writeFile(path.join(this.#buildPath, 'stats.json'), JSON.stringify(stats));
    }
}

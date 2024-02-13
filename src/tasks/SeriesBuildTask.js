import signale from 'signale';
import path from 'path';
import fs from 'fs-extra';

import TaskRunner from './TaskRunner.js';
import BuildTask from './BuildTask.js';
import MetadataBuildTask from './MetadataBuildTask.js';
import ArticleBuildTask from './ArticleBuildTask.js';
import MarkdownRenderer from '../MarkdownRenderer.js';
import { recurseDirectory } from '../utils.js';

export default class SeriesBuildTask extends BuildTask {
    #inDir;
    #outDir;

    constructor(inDir, outDir) {
        super();
        this.#inDir = inDir;
        this.#outDir = outDir;
    }

    async build() {
        // Renderer init
        const renderer = new MarkdownRenderer();
        renderer.currentSeries = path.basename(this.#inDir);

        const bibliographyPath = path.join(this.#inDir, 'bibliography.bib');
        renderer.bibliography = (await fs.exists(bibliographyPath)) ? bibliographyPath : undefined;

        signale.await(`Building series ${renderer.currentSeries}...`);

        // Series metadata
        const seriesTomlTask = new MetadataBuildTask(
            path.join(this.#inDir, 'series.toml'),
            path.join(this.#outDir, 'series.json'),
            'series.schema.json'
        );

        const seriesToml = await seriesTomlTask.build();

        const vfiles = [seriesToml];

        if (seriesToml.messages.length)
            return vfiles;

        const seriesMetadata = seriesToml.data.parsed;

        // Article build
        const taskRunner = new TaskRunner();
        const outPaths = [];

        for (const chapter of seriesMetadata.chapters) {
            for (const articlePath of chapter.articles) {
                const inPath = path.join(this.#inDir, articlePath) + '.md';
                const outPath = path.join(this.#outDir, articlePath) + '.md.json';

                outPaths.push(outPath);

                const articleBuildTask = new ArticleBuildTask(inPath, outPath, renderer, seriesToml);
                taskRunner.push(articleBuildTask);
            }
        }

        recurseDirectory(this.#outDir, async filePath => {
            const absPath = path.join(this.#outDir, filePath);
            if (absPath.endsWith('.md.json') && !outPaths.includes(absPath))
                await fs.rm(absPath);
        });

        return vfiles.concat(await taskRunner.run());
    }
}

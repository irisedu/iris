import signale from 'signale';
import path from 'path';
import fs from 'fs-extra';
import { reporter } from 'vfile-reporter';

import MetadataBuildTask from '../tasks/MetadataBuildTask.js';
import SeriesBuildTask from '../tasks/SeriesBuildTask.js';
import AssetsBuildTask from '../tasks/AssetsBuildTask.js';
import CompiledAssetsBuildTask from '../tasks/CompiledAssetsBuildTask.js';
import NetworkBuildTask from '../tasks/NetworkBuildTask.js';
import SearchIndexBuildTask from '../tasks/SearchIndexBuildTask.js';
import StatsBuildTask from '../tasks/StatsBuildTask.js';
import TaskRunner from '../tasks/TaskRunner.js';

const baseDir = path.join(import.meta.dirname, '../../patchouli');
const buildDir = path.join(import.meta.dirname, '../../build');

(async function() {
    const taskRunner = new TaskRunner();

    taskRunner.push(new MetadataBuildTask(
        path.join(baseDir, 'authors.toml'),
        path.join(buildDir, 'authors.json'),
        'authors.schema.json'
    ));

    taskRunner.push(new MetadataBuildTask(
        path.join(baseDir, 'categories.toml'),
        path.join(buildDir, 'categories.json'),
        'categories.schema.json',
        'categories'
    ));

    const categoryDirs = await fs.readdir(baseDir, { withFileTypes: true });

    for (const dirent of categoryDirs) {
        if (!dirent.isDirectory())
            continue;

        const categoryPath = path.join(baseDir, dirent.name);
        const seriesDirs = await fs.readdir(categoryPath);

        for (const seriesDir of seriesDirs) {
            const seriesInDir = path.join(categoryPath, seriesDir);
            const seriesOutDir = path.join(buildDir, path.basename(seriesInDir).toLowerCase());

            taskRunner.push(new SeriesBuildTask(seriesInDir, seriesOutDir));

            taskRunner.push(new AssetsBuildTask(
                path.join(seriesInDir, 'assets'),
                path.join(seriesOutDir, 'assets')
            ));

            taskRunner.push(new CompiledAssetsBuildTask(
                path.join(seriesInDir, 'assets-compiled'),
                path.join(seriesOutDir, 'assets-compiled')
            ));
        }
    }

    const postTaskRunner = new TaskRunner();
    postTaskRunner.push(new NetworkBuildTask(buildDir));
    postTaskRunner.push(new SearchIndexBuildTask(buildDir));
    postTaskRunner.push(new StatsBuildTask(buildDir));

    signale.start(`Running ${taskRunner.count()} tasks...`);
    signale.time('build');

    console.log();
    const vfiles = await taskRunner.run();
    await postTaskRunner.run();
    console.log();

    signale.timeEnd('build');
    signale.success('Build finished! File report:\n');
    console.log(reporter(vfiles));
})();

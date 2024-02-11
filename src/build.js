import { vfileMessage, shouldBuild } from './utils.js';
import { buildCompiledAssets } from './compiledAssets.js';

import path from 'path';
import fs from 'fs-extra';
import toml from '@iarna/toml';
import { VFile } from 'vfile';
import { validate } from '@hyperjump/json-schema/draft-2020-12';
import { reporter } from 'vfile-reporter';
import reflect from '@alumna/reflect';

const baseDir = path.join(import.meta.dirname, '../patchouli');
const buildDir = path.join(import.meta.dirname, '../build');

async function buildToml(inPath, outPath, schema, outKey) {
    const vfile = new VFile({ path: inPath });

    try {
        vfile.value = await fs.readFile(inPath, 'utf-8');
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

    const validateResult = await validate(path.join(import.meta.dirname, '../schemas', schema), tomlParsed);
    if (validateResult.valid) {
        vfile.data.parsed = tomlParsed;
        await fs.writeFile(outPath, JSON.stringify(outKey ? tomlParsed[outKey] : tomlParsed));
    } else {
        vfileMessage(vfile, null, 'toml-schema', 'File violates schema');
    }

    return vfile;
}

export async function buildSeries(directory, renderer) {
    renderer.currentSeries = path.basename(directory);

    const seriesBuildDir = path.join(buildDir, renderer.currentSeries.toLowerCase());
    await fs.ensureDir(seriesBuildDir);

    console.log(` == ${renderer.currentSeries} == `);

    // Series metadata
    const seriesTomlPath = path.join(directory, 'series.toml');
    const seriesToml = await buildToml(seriesTomlPath, path.join(seriesBuildDir, 'series.json'), 'series.schema.json');
    const files = [seriesToml];

    if (seriesToml.messages.length)
        return files;

    const seriesMetadata = seriesToml.data.parsed;

    // Bibliography
    const bibliographyPath = path.join(directory, 'bibliography.bib');
    renderer.bibliography = await fs.exists(bibliographyPath) ? bibliographyPath : undefined;

    const buildTasks = [];

    // Article build
    for (const chapter of seriesMetadata.chapters) {
        for (const articlePath of chapter.articles) {
            const inPath = path.join(directory, articlePath) + '.md';
            const outPath = path.join(seriesBuildDir, articlePath) + '.md.json';

            const promise = shouldBuild(inPath, outPath).then(build => {
                if (!build)
                    return;

                return fs.readFile(inPath).catch(() => {
                    vfileMessage(seriesToml, null, 'article-not-found', `Article not found at ${articlePath}`);
                });
            }).then(contents => {
                if (!contents)
                    return;

                return renderer.render(contents);
            }).then(vfile => {
                if (!vfile)
                    return;

                vfile.path = inPath;

                const fileObj = {
                    data: vfile.data,
                    contents: vfile.value,
                };

                return fs.ensureDir(path.dirname(outPath)).then(() =>
                    fs.writeFile(outPath, JSON.stringify(fileObj))
                ).then(() => vfile);
            });

            buildTasks.push(promise);
        }
    }

    const vfiles = (await Promise.all(buildTasks)).filter(f => f);

    // Assets
    await reflect({
        src: path.join(directory, 'assets'),
        dest: path.join(seriesBuildDir, 'assets'),

        recursive: true,
        delete: true,
        only_newer: true,
    });

    const compiledAssets = await buildCompiledAssets(directory, seriesBuildDir);

    return files.concat(vfiles).concat(compiledAssets);
}

export async function buildAll(renderer) {
    await fs.ensureDir(buildDir);

    console.log(' == Authors and categories files == ');

    const authorsTomlPath = path.join(baseDir, 'authors.toml');
    const authorsToml = await buildToml(authorsTomlPath, path.join(buildDir, 'authors.json'), 'authors.schema.json');

    const categoriesTomlPath = path.join(baseDir, 'categories.toml');
    const categoriesToml = await buildToml(categoriesTomlPath, path.join(buildDir, 'categories.json'), 'categories.schema.json', 'categories');

    console.log(reporter([authorsToml, categoriesToml]) + '\n');

    const categoryDirs = await fs.readdir(baseDir, { withFileTypes: true });

    for (const dirent of categoryDirs) {
        if (!dirent.isDirectory())
            continue;

        const categoryPath = path.join(baseDir, dirent.name);
        const seriesDirs = await fs.readdir(categoryPath);

        for (const seriesDir of seriesDirs) {
            const seriesPath = path.join(categoryPath, seriesDir);
            const vfiles = await buildSeries(seriesPath, renderer);

            console.log(reporter(vfiles) + '\n');
        }
    }
}

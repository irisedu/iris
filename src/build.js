import { vfileMessage } from './utils.js';

import path from 'path';
import fs from 'fs-extra';
import toml from '@iarna/toml';
import { VFile } from 'vfile';
import { validate } from '@hyperjump/json-schema/draft-2020-12';
import { reporter } from 'vfile-reporter';
import reflect from '@alumna/reflect';

const baseDir = path.join(import.meta.dirname, '../patchouli');
const buildDir = path.join(import.meta.dirname, '../build');

async function parseToml(filePath, schema, displayName) {
    const vfile = new VFile({ path: filePath });

    try {
        vfile.value = await fs.readFile(filePath, 'utf-8');
    } catch (e) {
        vfileMessage(vfile, null, 'toml-not-found', `Failed to read ${displayName}: ${e.toString()}`);
        return vfile;
    }

    let tomlParsed;

    try {
        tomlParsed = toml.parse(vfile.value);
    } catch (e) {
        vfileMessage(vfile, null, 'toml-invalid', `Failed to parse ${displayName}: ${e.toString()}`);
        return vfile;
    }

    const validateResult = await validate(path.join(import.meta.dirname, '../schemas', schema), tomlParsed);

    if (!validateResult.valid)
        vfileMessage(vfile, null, 'toml-schema', 'series.toml violates schema');

    vfile.data.parsed = tomlParsed;
    return vfile;
}

async function shouldBuild(inPath, outPath) {
    try {
        const res = await Promise.all([
            fs.stat(inPath),
            fs.stat(outPath)
        ]);

        return res[0].mtime > res[1].mtime;
    } catch {
        return true;
    }
}

export async function buildSeries(directory, renderer) {
    renderer.currentSeries = path.basename(directory);

    console.log(` == ${renderer.currentSeries} == `);

    // Series metadata
    const seriesTomlPath = path.join(directory, 'series.toml');
    const seriesToml = await parseToml(seriesTomlPath, 'series.schema.json', 'series.toml');
    const files = [seriesToml];

    if (seriesToml.messages.length)
        return files;

    const seriesBuildDir = path.join(buildDir, renderer.currentSeries.toLowerCase());
    await fs.ensureDir(seriesBuildDir);

    const seriesMetadata = seriesToml.data.parsed;
    await fs.writeFile(path.join(seriesBuildDir, 'series.json'), JSON.stringify(seriesMetadata));

    // Bibliography
    const bibliographyPath = path.join(directory, 'bibliography.bib');
    renderer.bibliography = await fs.exists(bibliographyPath) ? bibliographyPath : undefined;

    const buildTasks = [];

    // Article build
    for (const chapter of seriesMetadata.chapters) {
        for (const articlePath of chapter.articles) {
            const inPath = path.join(directory, articlePath) + '.md';
            const outPath = path.join(seriesBuildDir, articlePath) + '.md.json';

            const promise = shouldBuild(inPath, outPath).then(shouldBuild => {
                if (!shouldBuild)
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

    // Assets
    await reflect({
        src: path.join(directory, 'assets'),
        dest: path.join(seriesBuildDir, 'assets'),

        recursive: true,
        delete: true,
        only_newer: true,
    });

    const vfiles = (await Promise.all(buildTasks)).filter(f => f);
    return files.concat(vfiles);
}

export async function buildAll(renderer) {
    await fs.ensureDir(buildDir);

    console.log(' == Authors and categories files == ');

    const authorsTomlPath = path.join(baseDir, 'authors.toml');
    const authorsToml = await parseToml(authorsTomlPath, 'authors.schema.json', 'authors.toml');
    if (!authorsToml.messages.length) {
        await fs.writeFile(path.join(buildDir, 'authors.json'), JSON.stringify(authorsToml.data.parsed));
    }

    const categoriesTomlPath = path.join(baseDir, 'categories.toml');
    const categoriesToml = await parseToml(categoriesTomlPath, 'categories.schema.json', 'categories.toml');
    if (!categoriesToml.messages.length) {
        await fs.writeFile(path.join(buildDir, 'categories.json'), JSON.stringify(categoriesToml.data.parsed.categories));
    }

    console.log(reporter([authorsToml, categoriesToml]) + '\n');

    const categoryDirs = await fs.readdir(baseDir);

    for (const categoryDir of categoryDirs) {
        if (['authors.toml', 'categories.toml'].includes(categoryDir))
            continue;

        const categoryPath = path.join(baseDir, categoryDir);
        const seriesDirs = await fs.readdir(categoryPath);

        for (const seriesDir of seriesDirs) {
            const seriesPath = path.join(categoryPath, seriesDir);
            const vfiles = await buildSeries(seriesPath, renderer);

            console.log(reporter(vfiles) + '\n');
        }
    }
}

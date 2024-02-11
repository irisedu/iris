import { vfileMessage, shouldBuild } from './utils.js';

import path from 'path';
import fs from 'fs-extra';
import { VFile } from 'vfile';
import util from 'node:util';
import { execFile } from 'node:child_process';

const execFileP = util.promisify(execFile);

export function resolveCompiledPath(path) {
    if (path.endsWith('.tex')) {
        return path.slice(0, -4) + '.svg';
    }

    return path;
}

async function buildTex(inDir, inFile, outDir) {
    const inPath = path.join(inDir, inFile);
    const outPath = path.join(outDir, inFile);

    const inPathParsed = path.parse(inPath);
    const cwd = inPathParsed.dir;

    const outDirFull = path.dirname(outPath);

    const build = await shouldBuild(inPath, resolveCompiledPath(outPath));
    if (!build)
        return;

    const vfile = new VFile({ path: path.join(inDir, inFile) });

    try {
        await execFileP('latex', [inPathParsed.name], { cwd });
        const outSpec = path.join(outDirFull, '%f.svg');

        try {
            await fs.ensureDir(outDirFull);
            await execFileP('dvisvgm', [inPathParsed.name, '--no-fonts', '-o', outSpec], { cwd });
        } catch {
            vfileMessage(vfile, null, 'latex-compile', 'Failed to convert LaTeX to SVG');
        }
    } catch {
        vfileMessage(vfile, null, 'latex-compile', 'LaTeX failed to compile');
    }

    return vfile;
}

async function buildCompiledAssetsInternal(inDir, outDir, curr, tasks) {
    const directory = fs.readdirSync(path.join(inDir, curr), { withFileTypes: true });

    for (const dirent of directory) {
        if (dirent.isDirectory()) {
            buildCompiledAssetsInternal(inDir, outDir, path.join(curr, dirent.name), tasks);
            continue;
        }

        const inFile = path.join(curr, dirent.name);

        switch (path.extname(dirent.name)) {
        case '.tex':
            tasks.push(buildTex(inDir, inFile, outDir));
            break;
        }
    }
}

export async function buildCompiledAssets(inDir, outDir) {
    inDir = path.join(inDir, 'assets-compiled');
    outDir = path.join(outDir, 'assets-compiled');

    if (!await fs.exists(inDir))
        return [];

    const tasks = [];
    await buildCompiledAssetsInternal(inDir, outDir, '', tasks);

    return (await Promise.all(tasks)).filter(f => f);
}

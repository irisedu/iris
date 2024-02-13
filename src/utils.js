import fs from 'fs-extra';
import path from 'path';
import crypto from 'crypto';

export function vfileMessage(file, node, id, msg) {
    file.message(msg, {
        place: node && node.position,
        ruleId: id,
        source: 'patchouli',
    });
}

export async function shouldBuild(inPath, outPath) {
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

export async function recurseDirectory(dir, cb, curr) {
    if (!curr)
        curr = '';

    const directory = await fs.readdir(path.join(dir, curr), { withFileTypes: true });

    for (const dirent of directory) {
        const filePath = path.join(curr, dirent.name);

        if (dirent.isDirectory()) {
            await recurseDirectory(dir, cb, filePath);
            continue;
        }

        await cb(filePath);
    }
}

export function resolveInternalLink(link, currentSeries) {
    if (link.startsWith('@')) {
        // External series
        return `/${link.slice(1)}`;
    } else if (link.startsWith('$')) {
        // Current series
        return `/${currentSeries.toLowerCase()}/${link.slice(1)}`;
    }
}

export function internalLinkToPageLink(link) {
    return '/series' + link;
}

export function internalLinkToAssetTag(link) {
    return 'asset-' + crypto.createHash('md5').update(link).digest('hex').slice(0, 12);
}

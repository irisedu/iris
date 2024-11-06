import { promises as fs } from 'fs';
import path from 'path';
import { indexerLogger } from './logger.js';
import type { SeriesInfo } from 'patchouli';

export async function indexRepoDir(
	repoDir: string,
	contentRoot: string,
	seriesInfo: SeriesInfo[]
) {
	indexerLogger.info({ repoDir }, `Indexing ${repoDir} ...`);

	const buildDir = path.join(repoDir, 'build');
	const buildContents = await fs.readdir(buildDir, { withFileTypes: true });

	for (const dirent of buildContents) {
		if (!dirent.isDirectory()) continue;

		const seriesPath = path.join(buildDir, dirent.name);
		const seriesContents = await fs.readdir(seriesPath);

		const seriesOutPath = path.join(contentRoot, dirent.name);
		const seriesStaticPath = path.join(seriesOutPath, 'static');
		await fs.mkdir(seriesStaticPath, { recursive: true });

		for (const seriesFile of seriesContents) {
			await fs.cp(
				path.join(seriesPath, seriesFile),
				path.join(seriesStaticPath, seriesFile),
				{ recursive: true }
			);
		}
	}

	// Series info
	try {
		const seriesContents: SeriesInfo[] = JSON.parse(
			await fs.readFile(path.join(buildDir, 'series.json'), 'utf-8')
		);

		seriesContents.forEach((s) => seriesInfo.push(s));
	} catch {
		indexerLogger.warn(
			{ repoDir },
			`Failed to read series.json for ${repoDir}`
		);
	}
}

export async function indexRepoFiles(repoRoot: string, contentRoot: string) {
	await fs.mkdir(contentRoot, { recursive: true });

	const repoDirs = await fs.readdir(repoRoot);

	const seriesInfo: SeriesInfo[] = [];

	await Promise.all(
		repoDirs.map((buildDir) =>
			indexRepoDir(path.join(repoRoot, buildDir), contentRoot, seriesInfo)
		)
	);

	await fs.writeFile(
		path.join(contentRoot, 'series.json'),
		JSON.stringify(seriesInfo)
	);
}

import { promises as fs } from 'fs';
import path from 'path';
import { indexerLogger } from './logger.js';

export async function indexRepoDir(repoDir: string, contentRoot: string) {
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
				path.join(seriesStaticPath, seriesFile)
			);
		}
	}
}

export async function indexRepoFiles(repoRoot: string, contentRoot: string) {
	await fs.mkdir(contentRoot, { recursive: true });

	const repoDirs = await fs.readdir(repoRoot);

	await Promise.all(
		repoDirs.map((buildDir) =>
			indexRepoDir(path.join(repoRoot, buildDir), contentRoot)
		)
	);
}

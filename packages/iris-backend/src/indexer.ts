import { promises as fs } from 'fs';
import path from 'path';
import { indexerLogger } from './logger.js';

export async function indexBuildDir(buildDir: string, contentRoot: string) {
	indexerLogger.info({ buildDir }, `Indexing ${buildDir} ...`);

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

export async function indexBuildFiles(buildRoot: string, contentRoot: string) {
	await fs.mkdir(contentRoot, { recursive: true });

	const buildDirs = await fs.readdir(buildRoot);

	await Promise.all(
		buildDirs.map((buildDir) =>
			indexBuildDir(path.join(buildRoot, buildDir), contentRoot)
		)
	);
}

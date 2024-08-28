import logger from './logger';
import path from 'path';
import fs from 'fs-extra';
import anymatch from 'anymatch';
import { shouldBuild, recurseDirectory, getIgnoredPaths } from './utils';
import type { UserConfig } from './config';
import type FileProcessor from './FileProcessor';
import type FileInfo from './FileInfo';
import type CollectionProcessor from './collectionProcessing/CollectionProcessor';

import IrisFileProcessor from './compile/IrisFileProcessor';
import TeXFileProcessor from './compile/assets/TeXFileProcessor';
import NunjucksFileProcessor from './compile/assets/NunjucksFileProcessor';
import TomlFileProcessor from './compile/TomlFileProcessor';
import CatchAllFileProcessor from './compile/assets/CatchAllFileProcessor';

import SvgFileProcessor from './postCompile/SvgFileProcessor';
import HtmlFileProcessor from './postCompile/HtmlFileProcessor';

import IrisCollectionProcessor from './collectionProcessing/IrisCollectionProcessor';
import NetworkCollectionProcessor from './collectionProcessing/NetworkCollectionProcessor';
import SchemaCollectionProcessor from './collectionProcessing/SchemaCollectionProcessor';
import SeriesCollectionProcessor from './collectionProcessing/SeriesCollectionProcessor';

/**
 * Step 1: per-file compilation
 */
async function compileStep(config: UserConfig, inDir: string, outDir: string) {
	const processors: FileProcessor[] = [
		new IrisFileProcessor(config),
		new TeXFileProcessor(config),
		new NunjucksFileProcessor(config),
		new TomlFileProcessor(config),
		new CatchAllFileProcessor(config)
	];

	const tasks: ReturnType<FileProcessor['process']>[] = [];
	const handledFiles: Record<string, string> = {};

	await recurseDirectory(inDir, async (filePath) => {
		if (anymatch(getIgnoredPaths(config), filePath)) {
			return;
		}

		for (const processor of processors) {
			if (!processor.handlesFile(filePath)) {
				continue;
			}

			const inPath = path.join(inDir, filePath);
			const outPath = path.join(
				outDir,
				(processor.constructor as typeof FileProcessor).getOutputPath(filePath)
			);

			handledFiles[outPath] = inPath;

			if (!(await shouldBuild(inPath, outPath))) {
				logger.note('Skipping file', filePath, '(cached)');
				break;
			}

			logger.await('Building file at', filePath, '...');
			tasks.push(processor.process({ inDir, outDir, filePath }));
			break;
		}
	});

	return {
		fileInfo: (await Promise.all(tasks)).filter((vf) => vf !== undefined),
		handledFiles
	};
}

/**
 * Step 2: per-file post-compilation/optimization
 */
async function postCompileStep(
	config: UserConfig,
	inDir: string,
	outDir: string,
	fileInfo: FileInfo[],
	handledFiles: Record<string, string>
) {
	const processors: FileProcessor[] = [
		new SvgFileProcessor(config),
		new HtmlFileProcessor(config)
	];

	const tasks: ReturnType<FileProcessor['process']>[] = [];

	for (const vf of fileInfo) {
		const inPath = path.join(inDir, vf.path);
		let outPath;
		for (const [o, i] of Object.entries(handledFiles)) {
			if (i === inPath) {
				outPath = o;
				break;
			}
		}

		if (!outPath) {
			continue;
		}

		for (const processor of processors) {
			if (!processor.handlesFile(outPath)) {
				continue;
			}

			logger.await('Post-processing file at', vf.path, '...');
			tasks.push(
				processor.process({
					inDir: outDir,
					outDir,
					filePath: vf.path
				})
			);
			break;
		}

		await Promise.all(tasks);
	}
}

/**
 * Step 3: remove files whose source has been deleted
 */
async function cleanStep(handledFiles: Record<string, string>, outDir: string) {
	await recurseDirectory(outDir, async (filePath) => {
		const fullPath = path.join(outDir, filePath);
		if (!handledFiles[fullPath]) {
			logger.note('Removing file', filePath, '(no source)');
			await fs.rm(fullPath);
		}
	});
}

/**
 * Step 4: general collection processing
 */
async function collectionProcessStep(
	config: UserConfig,
	inDir: string,
	outDir: string,
	fileInfo: FileInfo[]
) {
	const processors: CollectionProcessor[] = [
		new IrisCollectionProcessor(config),
		new NetworkCollectionProcessor(config),
		new SchemaCollectionProcessor(config),
		new SeriesCollectionProcessor(config)
	];

	const tasks: ReturnType<CollectionProcessor['process']>[] = [];

	for (const processor of processors) {
		logger.await('Running', processor.constructor.name, '...');
		tasks.push(processor.process({ inDir, outDir, fileInfo }));
	}

	await Promise.all(tasks);
}

export default async function build(config: UserConfig, inDir: string) {
	const outDir = path.join(inDir, 'build');

	const { fileInfo, handledFiles } = await compileStep(config, inDir, outDir);
	await postCompileStep(config, inDir, outDir, fileInfo, handledFiles);
	await cleanStep(handledFiles, outDir);
	await collectionProcessStep(config, inDir, outDir, fileInfo);

	return fileInfo;
}

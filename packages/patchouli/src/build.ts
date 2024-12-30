import logger from './logger.js';
import path from 'path';
import fs from 'fs-extra';
import anymatch from 'anymatch';
import { shouldBuild, recurseDirectory, getIgnoredPaths } from './utils.js';
import type { UserConfig } from './config.js';
import type FileProcessor from './FileProcessor.js';
import type FileInfo from './FileInfo.js';
import type CollectionProcessor from './collectionProcessing/CollectionProcessor.js';

import IrisFileProcessor from './compile/IrisFileProcessor.js';
import QuestionFileProcessor from './compile/QuestionFileProcessor.js';
import TeXFileProcessor from './compile/assets/TeXFileProcessor.js';
import NunjucksFileProcessor from './compile/assets/NunjucksFileProcessor.js';
import TomlFileProcessor from './compile/TomlFileProcessor.js';
import CatchAllFileProcessor from './compile/assets/CatchAllFileProcessor.js';

import SvgFileProcessor from './postCompile/SvgFileProcessor.js';
import HtmlFileProcessor from './postCompile/HtmlFileProcessor.js';

import IrisCollectionProcessor from './collectionProcessing/IrisCollectionProcessor.js';
import NetworkCollectionProcessor from './collectionProcessing/NetworkCollectionProcessor.js';
import SeriesCollectionProcessor from './collectionProcessing/SeriesCollectionProcessor.js';

/**
 * Step 1: per-file compilation
 */
async function compileStep(config: UserConfig, inDir: string, outDir: string) {
	const processors: FileProcessor[] = [
		new IrisFileProcessor(config),
		new QuestionFileProcessor(config),
		new TeXFileProcessor(config),
		new NunjucksFileProcessor(config),
		new TomlFileProcessor(config),
		new CatchAllFileProcessor(config)
	];

	const tasks: ReturnType<FileProcessor['process']>[] = [];
	const handledFiles: Record<string, string> = {};

	await recurseDirectory(inDir, async (filePath) => {
		// FIXME
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		if ((anymatch as any)(getIgnoredPaths(config), filePath)) {
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

			logger.await('Post-processing file at', outPath, '...');
			tasks.push(
				processor.process({
					inDir: outDir,
					outDir,
					filePath: path.relative(outDir, outPath)
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
		// Special case
		if (filePath === 'build.json') return;

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
		new SeriesCollectionProcessor(config)
	];

	const tasks: ReturnType<CollectionProcessor['process']>[] = [];

	for (const processor of processors) {
		logger.await('Running', processor.constructor.name, '...');
		tasks.push(processor.process({ inDir, outDir, fileInfo }));
	}

	await Promise.all(tasks);
}

// Version history:
// 1: Init
// 2: Remove the `doc` node
const BUILD_VERSION = 2;

export default async function build(config: UserConfig, inDir: string) {
	const outDir = path.join(inDir, 'build');
	const buildMetaPath = path.join(outDir, 'build.json');

	try {
		const contents = JSON.parse(await fs.readFile(buildMetaPath, 'utf-8'));
		if (contents.version !== BUILD_VERSION) {
			throw new Error();
		}
	} catch {
		logger.info('Rebuilding due to build version update...');
		await fs.rm(outDir, { recursive: true, force: true });
	}

	await fs.ensureDir(outDir);
	await fs.writeFile(
		buildMetaPath,
		JSON.stringify({
			version: BUILD_VERSION
		})
	);

	const { fileInfo, handledFiles } = await compileStep(config, inDir, outDir);
	await postCompileStep(config, inDir, outDir, fileInfo, handledFiles);
	await cleanStep(handledFiles, outDir);
	await collectionProcessStep(config, inDir, outDir, fileInfo);

	return fileInfo;
}

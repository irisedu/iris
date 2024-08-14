import logger from './logger';
import path from 'path';
import fs from 'fs-extra';
import anymatch from 'anymatch';
import { reporterPretty } from 'vfile-reporter-pretty';
import { shouldBuild, recurseDirectory, getIgnoredPaths } from './utils';

import MarkdownFileProcessor from './compile/markdown/MarkdownFileProcessor';
import TeXFileProcessor from './compile/assets/TeXFileProcessor';
import NunjucksFileProcessor from './compile/assets/NunjucksFileProcessor';
import TomlFileProcessor from './compile/TomlFileProcessor';
import CatchAllFileProcessor from './compile/assets/CatchAllFileProcessor';

import SvgFileProcessor from './postCompile/SvgFileProcessor';
import HtmlFileProcessor from './postCompile/HtmlFileProcessor';

import StatsCollectionProcessor from './collectionProcessing/StatsCollectionProcessor';
import NetworkCollectionProcessor from './collectionProcessing/NetworkCollectionProcessor';
import SchemaCollectionProcessor from './collectionProcessing/SchemaCollectionProcessor';

/**
 * Step 1: per-file compilation
 */
async function compileStep(config, inDir: string, outDir: string) {
	const processors = [
		new MarkdownFileProcessor(config),
		new TeXFileProcessor(config),
		new NunjucksFileProcessor(config),
		new TomlFileProcessor(config),
		new CatchAllFileProcessor(config),
		...config.platform.pipeline.compile.map((C) => new C(config))
	];

	const tasks = [];
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
				processor.constructor.getOutputPath(filePath)
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
		vfiles: (await Promise.all(tasks)).filter((vf) => vf),
		handledFiles
	};
}

/**
 * Step 2: per-file post-compilation/optimization
 */
async function postCompileStep(
	config,
	inDir: string,
	outDir: string,
	vfiles,
	handledFiles: Record<string, string>
) {
	const processors = [
		new SvgFileProcessor(config),
		new HtmlFileProcessor(config),
		...config.platform.pipeline.postCompile.map((C) => new C(config))
	];

	const tasks = [];

	for (const vf of vfiles) {
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
 * Step 3: general collection processing
 */
async function collectionProcessStep(
	config,
	inDir: string,
	outDir: string,
	vfiles,
	handledFiles: Record<string, string>
) {
	const processors = [
		new StatsCollectionProcessor(config),
		new NetworkCollectionProcessor(config),
		new SchemaCollectionProcessor(config),
		...config.platform.pipeline.collectionProcessors.map((C) => new C(config))
	];

	const tasks = [];

	for (const processor of processors) {
		logger.await('Running', processor.constructor.name, '...');
		tasks.push(processor.process({ inDir, outDir, vfiles, handledFiles }));
	}

	await Promise.all(tasks);
}

/**
 * Step 4: remove files whose source has been deleted
 */
async function cleanStep(handledFiles: Record<string, string>, outDir: string) {
	await recurseDirectory(outDir, async (filePath) => {
		const fullPath = path.join(outDir, filePath);
		if (!handledFiles[fullPath]) {
			logger.note('Removing file', filePath, '(original removed)');
			await fs.rm(fullPath);
		}
	});
}

export default async function build(config, projectPath: string) {
	const inDir = projectPath;
	const outDir = path.join(projectPath, 'build');

	const { vfiles, handledFiles } = await compileStep(config, inDir, outDir);
	await postCompileStep(config, inDir, outDir, vfiles, handledFiles);
	await collectionProcessStep(config, inDir, outDir, vfiles, handledFiles);
	await cleanStep(handledFiles, outDir);

	logger.raw(reporterPretty(vfiles));
}

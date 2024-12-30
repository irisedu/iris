import logger from './logger.js';
import fs from 'fs-extra';
import path from 'path';
import toml from '@iarna/toml';
import { defaultUserConfig, type UserConfig } from './config.js';

export async function findFileInParents(filePath: string, fileName: string) {
	const searchPath = path.join(filePath, fileName);

	if (await fs.exists(searchPath)) {
		return searchPath;
	}

	if (filePath !== '.' && filePath !== '/') {
		return await findFileInParents(path.dirname(filePath), fileName);
	}
}

export async function readConfig(configPath?: string) {
	let configContents = defaultUserConfig;

	if (configPath) {
		try {
			configContents = await fs.readFile(configPath, 'utf-8');
		} catch {
			logger.info('Failed to read configuration, falling back to defaults...');
		}
	}

	let config: UserConfig;

	try {
		// TODO: validate this using JSON schema
		config = toml.parse(configContents) as unknown as UserConfig;
	} catch (e: unknown) {
		logger.error('Failed to read configuration:');
		logger.error(e);

		return null;
	}

	return config;
}

export async function findProject() {
	let projectPath = process.cwd();
	const configPath = await findFileInParents(process.cwd(), 'patchouli.toml');
	if (configPath) {
		logger.info(`Found configuration: ${configPath}`);
		projectPath = path.dirname(configPath);
	}

	const config = await readConfig(configPath);
	if (!config) process.exit(1);

	logger.info(`Project path: ${projectPath}`);

	return {
		config,
		projectPath
	};
}

export async function shouldBuild(inPath: string, outPath: string) {
	try {
		const res = await Promise.all([fs.stat(inPath), fs.stat(outPath)]);

		return res[0].mtime > res[1].mtime;
	} catch {
		return true;
	}
}

/**
 * Recurses the given directory, calling the optionally async callback with the
 * current file path relative to the given directory.
 */
export async function recurseDirectory(
	dir: string,
	cb: (rel: string) => void | Promise<void>,
	curr?: string
) {
	if (!curr) {
		curr = '';
	}

	const directory = await fs.readdir(path.join(dir, curr), {
		withFileTypes: true
	});

	for (const dirent of directory) {
		const filePath = path.join(curr, dirent.name);

		if (dirent.isDirectory()) {
			await recurseDirectory(dir, cb, filePath);
			continue;
		}

		await cb(filePath);
	}
}

export function resolveInternalLink(
	link: string,
	filePath: string,
	extensions: boolean = false
) {
	if (extensions) {
		if (link.endsWith('.tex')) {
			link = link.slice(0, -4) + '.svg';
		}
	}

	if (link.startsWith('@')) {
		// Absolute
		return `/${link.slice(1)}`;
	} else if (link.startsWith('$')) {
		// Relative
		const dir = path.dirname(filePath);
		const target = path.join(dir, link.slice(1)).replaceAll(path.sep, '/');

		return '/' + target;
	}
}

export function internalLinkToPageLink(link: string) {
	return '/page' + link;
}

export function getIgnoredPaths(config: UserConfig) {
	return config.ignoredPaths.concat(['patchouli.toml', 'build/**', '**/*.bib']);
}

import logger from './logger';
import crypto from 'crypto';
import fs from 'fs-extra';
import path from 'path';
import toml from '@iarna/toml';
import defaultUserConfig from './defaultUserConfig';

import irisPlatformConfig from './iris/platformConfig';

export async function findFileInParents(filePath: string, fileName: string) {
	const searchPath = path.join(filePath, fileName);

	if (await fs.exists(searchPath)) {
		return searchPath;
	}

	if (filePath !== '.' && filePath !== '/') {
		return await findFileInParents(path.dirname(filePath), fileName);
	}
}

export async function findProject() {
	let configContents = defaultUserConfig;
	let projectPath = process.cwd();
	const configPath = await findFileInParents(process.cwd(), 'patchouli.toml');

	if (configPath) {
		logger.info(`Found configuration: ${configPath}`);
		configContents = await fs.readFile(configPath, 'utf-8');
		projectPath = path.dirname(configPath);
	}

	let userConfig;

	try {
		userConfig = toml.parse(configContents);
	} catch (e) {
		logger.error('Failed to read configuration:');
		console.error(e);

		process.exit(1);
	}

	logger.info(`Project path: ${projectPath}`);

	let platformConfig;

	if (userConfig.platform === 'iris') {
		platformConfig = irisPlatformConfig;
	}

	if (platformConfig) {
		logger.info(`Using platform '${userConfig.platform}'`);
	} else {
		logger.warn(
			`Invalid platform: ${userConfig.platform}; falling back to 'iris'`
		);
		platformConfig = irisPlatformConfig;
	}

	return {
		config: {
			user: userConfig,
			platform: platformConfig
		},
		projectPath
	};
}

export function vfileMessage(file, node, id, msg) {
	file.message(msg, {
		place: node && node.position,
		ruleId: id,
		source: 'patchouli'
	});
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

export function resolveInternalLink(link: string, filePath: string) {
	if (link.startsWith('@')) {
		// Absolute
		return `/${link.slice(1)}`;
	} else if (link.startsWith('$')) {
		// Relative
		const dir = path.dirname(filePath);
		const target = path.join(dir, link.slice(1));

		return '/' + target;
	}
}

export function internalLinkToPageLink(link: string) {
	return '/page' + link;
}

export function internalLinkToAssetTag(link) {
	return (
		'asset-' + crypto.createHash('md5').update(link).digest('hex').slice(0, 12)
	);
}

export function getIgnoredPaths(config) {
	return config.user.ignoredPaths.concat([
		'patchouli.toml',
		'build/**',
		'**/*.bib'
	]);
}

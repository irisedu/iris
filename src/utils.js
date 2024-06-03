import signale from 'signale';
import crypto from 'crypto';
import fs from 'fs-extra';
import path from 'path';
import { spawn } from 'node:child_process';
import toml from '@iarna/toml';
import defaultUserConfig from './defaultUserConfig.js';

import irisPlatformConfig from './iris/platformConfig.js';

export async function findFileInParents(filePath, fileName) {
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
		signale.info(`Found configuration: ${configPath}`);
		configContents = await fs.readFile(configPath);
		projectPath = path.dirname(configPath);
	}

	let userConfig;

	try {
		userConfig = toml.parse(configContents);
	} catch (e) {
		signale.error('Failed to read configuration:');
		console.error(e);

		process.exit(1);
	}

	signale.info(`Project path: ${projectPath}`);

	let platformConfig;

	if (userConfig.platform === 'iris') {
		platformConfig = irisPlatformConfig;
	}

	if (platformConfig) {
		signale.info(`Using platform '${userConfig.platform}'`);
	} else {
		signale.warn(
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

export async function shouldBuild(inPath, outPath) {
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
export async function recurseDirectory(dir, cb, curr) {
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

export function resolveInternalLink(link, filePath) {
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

export function internalLinkToPageLink(link) {
	return '/page' + link;
}

export function internalLinkToAssetTag(link) {
	return (
		'asset-' + crypto.createHash('md5').update(link).digest('hex').slice(0, 12)
	);
}

export async function langtoolStart(config) {
	signale.await('Starting LanguageTool server...');

	const langtoolProcess = spawn(config.serverPath, ['--port', config.port]);

	await (async function wait() {
		try {
			const res = await langtoolCheck(config, {
				language: 'en-US',
				text: 'This is a test.'
			});
			if (res.status !== 200) {
				await wait();
			}
		} catch (e) {
			await wait();
		}
	})();

	signale.success('LanguageTool server started.');

	return langtoolProcess;
}

export function langtoolCheck(config, params = {}) {
	return fetch(`http://127.0.0.1:${config.port}/v2/check`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			Accept: 'application/json'
		},
		body: new URLSearchParams(params)
	});
}

export function handleExit(cb) {
	process.on('exit', cb);
	process.on('SIGINT', cb);
	process.on('SIGUSR1', cb);
	process.on('SIGUSR2', cb);
}

export function getIgnoredPaths(config) {
	return config.user.ignoredPaths.concat([
		'patchouli.toml',
		'build/**',
		'**/*.bib'
	]);
}

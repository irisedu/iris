import path from 'path';

export const repoRoot =
	process.env.BUILD_ROOT || path.join(process.cwd(), 'repo');
export const assetsRoot =
	process.env.ASSETS_ROOT || path.join(process.cwd(), 'assets');
export const spaRoot = process.env.SPA_ROOT || path.join(process.cwd(), 'spa');

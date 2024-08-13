import type * as Preload from '../preload';

declare global {
	const win: Preload.WinGlobal;
	const process: Preload.ProcessGlobal;
	const os: Preload.OsGlobal;
	const app: Preload.AppGlobal;
	const fs: Preload.FsGlobal;
	const shell: Preload.ShellGlobal;
}

export default global;

import unzipper from 'unzipper';
import { type Readable } from 'stream';
import { promises as fs } from 'fs';
import { execFile as execFileCb } from 'node:child_process';
import util from 'node:util';

export async function extractStream(
	read: Readable,
	outDir: string
): Promise<void> {
	await fs.mkdir(outDir, { recursive: true });

	return new Promise((res, rej) => {
		const un = unzipper.Extract({ path: outDir });
		read.pipe(un).on('close', res).on('error', rej);
	});
}

export const execFile = util.promisify(execFileCb);

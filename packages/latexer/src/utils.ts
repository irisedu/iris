import unzipper from 'unzipper';
import { type Readable } from 'stream';
import stream from 'stream/promises';
import { promises as fs } from 'fs';
import { execFile as execFileCb } from 'node:child_process';
import util from 'node:util';

export async function extractStream(
	read: Readable,
	outDir: string
): Promise<void> {
	await fs.mkdir(outDir, { recursive: true });
	const un = unzipper.Extract({ path: outDir });
	await stream.pipeline(read, un);
}

export const execFile = util.promisify(execFileCb);

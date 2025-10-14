import { Router } from 'express';
import { buildDir, artifactDir } from '../constants.js';
import { extractStream, execFile } from '../utils.js';
import path from 'path';
import crypto from 'crypto';
import os from 'os';
import { promises as fs, createReadStream } from 'fs';

const workingDir = path.join(buildDir, 'latex');
const resultDir = path.join(artifactDir, 'latex');

const router = Router();

const engines = ['pdflatex', 'lualatex', 'xelatex'];

async function build(engine: string, buildDir: string) {
	const mainFile = 'main';

	let result = 'success';
	let stdout = '';
	let stderr = '';

	try {
		const { stdout: mainStdout, stderr: mainStderr } = await execFile(
			engine,
			['-halt-on-error', '-interaction', 'nonstopmode', mainFile],
			{
				cwd: buildDir
			}
		);

		stdout += mainStdout;
		stderr += mainStderr;
	} catch (e: unknown) {
		result = 'latexCompilationFailed';

		if (e instanceof Error) {
			stdout += (e as any).stdout ?? ''; // eslint-disable-line @typescript-eslint/no-explicit-any
			stderr += (e as any).stderr ?? ''; // eslint-disable-line @typescript-eslint/no-explicit-any
		}

		return { result, stdout, stderr };
	}

	try {
		const { stdout: svgStdout, stderr: svgStderr } = await execFile(
			'pdftocairo',
			['-svg', '-f', '1', '-l', '1', 'main.pdf', 'main.svg'],
			{ cwd: buildDir }
		);

		stdout += svgStdout;
		stderr += svgStderr;
	} catch (e: unknown) {
		result = 'svgConversionFailed';

		if (e instanceof Error) {
			stdout += (e as any).stdout ?? ''; // eslint-disable-line @typescript-eslint/no-explicit-any
			stderr += (e as any).stderr ?? ''; // eslint-disable-line @typescript-eslint/no-explicit-any
		}

		return { result, stdout, stderr };
	}

	return { result, stdout, stderr };
}

router.post('/:id/submit', (req, res, next) => {
	const { id } = req.params;
	let { engine } = req.query;

	const uid = crypto.randomUUID();

	const submitDir = path.join(workingDir, uid);

	if (typeof engine !== 'string' || !engines.includes(engine)) {
		engine = engines[0];
	}

	fs.rm(submitDir, { recursive: true, force: true })
		.then(async () => {
			await extractStream(req, submitDir);

			const mainFile = path.join(submitDir, 'main.tex');
			try {
				await fs.access(mainFile);
			} catch {
				res.status(400);
				res.json({
					type: 'badRequest',
					error: 'LaTeX build requires a main.tex in the root of the ZIP file.'
				});

				return;
			}

			const { result, stdout, stderr } = await build(engine, submitDir);

			if (result != 'success') {
				res.status(500);
				res.json({
					type: result,
					error: 'Build failed. Check logs for details.',
					stdout,
					stderr
				});
				return;
			}

			try {
				await fs.mkdir(resultDir, { recursive: true });
				await fs.cp(
					path.join(submitDir, 'main.pdf'),
					path.join(resultDir, `${id}.pdf`)
				);
				await fs.cp(
					path.join(submitDir, 'main.svg'),
					path.join(resultDir, `${id}.svg`)
				);
			} catch {
				res.status(500);
				res.json({
					type: 'copyFailed',
					error: 'Failed to copy build results.'
				});

				return;
			}

			res.json({
				type: 'success',
				engine,
				stdout,
				stderr
			});
		})
		.catch(next);
});

router.get('/:id/result/:format', (req, res, next) => {
	const { id, format } = req.params;

	if (!['pdf', 'svg'].includes(format)) {
		res.status(400);
		res.json({
			type: 'badRequest',
			error: 'Only `pdf` and `svg` formats are supported.'
		});
		return;
	}

	const filePath = path.join(resultDir, `${id}.${format}`);
	fs.access(filePath)
		.then(() => {
			res.contentType(format);
			createReadStream(filePath).on('error', next).pipe(res);
		})
		.catch(() => {
			res.status(404);
			res.json({
				type: 'notFound',
				error: 'Requested job artifact does not exist.'
			});
		});
});

export default router;

export async function installTexmf() {
	const homeDir = os.homedir();
	const texmfDir = path.join(homeDir, 'texmf/tex/latex/');
	const texmfSrcDir = path.join(import.meta.dirname, '../../texmf');
	const texmfDestDir = path.join(texmfDir, 'latexer');

	await fs.mkdir(texmfDir, { recursive: true });
	await fs.cp(texmfSrcDir, texmfDestDir, { recursive: true });
}

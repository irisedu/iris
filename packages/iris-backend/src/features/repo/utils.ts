import { db } from '../../db/index.js';
import archiver from 'archiver';

export async function getUserWorkspaceGroup(uid: string, wid: string) {
	return (
		await db
			.selectFrom('repo_workspace_group')
			.where('workspace_id', '=', wid)
			.where('user_id', '=', uid)
			.select('group_name')
			.executeTakeFirst()
	)?.group_name;
}

export async function getQuestionArchive(
	type: string,
	data: unknown,
	template: string
): Promise<Buffer> {
	const buffers: Buffer[] = [];

	if (type === 'latex') {
		const archive = archiver('zip');

		await new Promise((res, rej) => {
			archive.on('data', (data) => {
				buffers.push(data);
			});
			archive.on('end', res);
			archive.on('error', rej);

			let code = (data as { code: string }).code;

			if (template === 'builtin') {
				code = `\\documentclass{article}

\\begin{document}
${code}
\\end{document}
`;
			}

			archive.append(code, { name: 'main.tex' });
			archive.finalize();
		});
	}

	return Buffer.concat(buffers);
}

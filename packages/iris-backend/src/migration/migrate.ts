// pnpx nodemon -r dotenv/config src/migration/migrate.ts
import { db } from '../db/index.js';
import { s3Client } from '../features/obj/index.js';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { HeadObjectCommand, NotFound } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';

const d = JSON.parse(
	fs.readFileSync(path.join(import.meta.dirname, 'dump.json'), 'utf-8')
);
const mapping = JSON.parse(
	fs.readFileSync(path.join(import.meta.dirname, 'mapping.json'), 'utf-8')
);

const owner = 'wongzhao';
const defaultAuthor = 'test';
const twoVariables = ['TERM', 'COURSE'];
const threeVariables = ['TERM', 'EXAM', 'TIME_LIMIT'];

(async function () {
	console.log('USER ACCOUNTS');
	console.log(
		'================================================================================'
	);

	const netidToUuid: Record<string, string> = {};
	for (const [netid, name] of Object.entries(mapping.authorNames)) {
		const user = await db
			.insertInto('user_account')
			.values({
				email: `${netid}@umail.ucsb.edu`,
				name: name as string
			})
			.onConflict((c) =>
				c.column('email').doUpdateSet({ name: (eb) => eb.ref('excluded.name') })
			)
			.returning('id')
			.executeTakeFirst();

		if (!user) {
			console.log(`Something went wrong making user ${netid}`);
			continue;
		}

		console.log(`${netid} => ${user.id}`);
		netidToUuid[netid] = user.id;
	}

	console.log(
		'================================================================================'
	);

	console.log('WORKSPACES');
	console.log(
		'================================================================================'
	);

	const workspacesToCreate = new Set<string>();

	for (const question of d.questions) {
		workspacesToCreate.add(
			(mapping.examQuestions as Record<string, string>)[question.id] ??
				question.course
		);
	}

	for (const worksheet of d.worksheets) {
		workspacesToCreate.add(
			(mapping.examWorksheets as Record<string, string>)[worksheet.id] ??
				worksheet.course
		);
	}

	const courseNameToWorkspaceUuid: Record<string, string> = {};

	for (const name of workspacesToCreate) {
		const workspace = await db
			.insertInto('repo_workspace')
			.values({
				name
			})
			.returning('id')
			.onConflict((c) =>
				c.column('name').doUpdateSet({ name: (eb) => eb.ref('excluded.name') })
			)
			.executeTakeFirst();

		if (!workspace) {
			console.log(`Something went wrong making workspace ${name}`);
			continue;
		}

		await db
			.insertInto('repo_workspace_group')
			.values({
				user_id: netidToUuid[owner],
				workspace_id: workspace.id,
				group_name: 'owner'
			})
			.onConflict((c) => c.doNothing())
			.execute();

		console.log(`${name} => ${workspace.id}`);
		courseNameToWorkspaceUuid[name] = workspace.id;
	}

	console.log(
		'================================================================================'
	);

	console.log('TAGS');
	console.log(
		'================================================================================'
	);

	const tagsToCreate: Record<string, Set<string>> = {};

	for (const question of d.questions) {
		const course =
			(mapping.examQuestions as Record<string, string>)[question.id] ??
			question.course;
		const workspaceId = courseNameToWorkspaceUuid[course];

		if (!tagsToCreate[workspaceId]) tagsToCreate[workspaceId] = new Set();
		if (question.type?.length)
			tagsToCreate[workspaceId].add('Type:' + question.type);
		if (question.diff?.length)
			tagsToCreate[workspaceId].add('Diff:' + question.diff);
	}

	for (const questionTag of d.tags) {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const question = d.questions.find((q: any) => q.id === questionTag.qid);
		if (!question) continue;

		const course =
			(mapping.examQuestions as Record<string, string>)[question.id] ??
			question.course;
		const workspaceId = courseNameToWorkspaceUuid[course];

		if (!tagsToCreate[workspaceId]) tagsToCreate[workspaceId] = new Set();
		tagsToCreate[workspaceId].add(questionTag.tag);
	}

	const tagWidNameToId: Record<string, Record<string, string>> = {};

	for (const [wid, tags] of Object.entries(tagsToCreate)) {
		tagWidNameToId[wid] = {};

		for (const tag of tags) {
			const existing = await db
				.selectFrom('repo_tag')
				.where('workspace_id', '=', wid)
				.where('name', '=', tag)
				.select('id')
				.executeTakeFirst();

			if (existing) {
				tagWidNameToId[wid][tag] = existing.id;
				console.log(`${wid}/${tag} => ${existing.id}`);
			} else {
				const newTag = await db
					.insertInto('repo_tag')
					.values({
						workspace_id: wid,
						name: tag
					})
					.returning('id')
					.executeTakeFirst();

				if (!newTag) {
					console.log(
						`Something went wrong making tag ${tag} in workspace ${wid}`
					);
					continue;
				}

				tagWidNameToId[wid][tag] = newTag.id;
				console.log(`${wid}/${tag} => ${newTag.id}`);
			}
		}
	}

	console.log(
		'================================================================================'
	);

	console.log('QUESTIONS');
	console.log(
		'================================================================================'
	);

	const qnumToId: Record<number, string> = {};

	for (const q of d.questions) {
		const existing = await db
			.selectFrom('repo_question')
			.where('num', '=', q.id)
			.select('id')
			.executeTakeFirst();

		if (existing) {
			console.log(`q${q.id} => ${existing.id}`);
			qnumToId[q.id] = existing.id;
			continue;
		}

		const mappedCourse = (mapping.examQuestions as Record<string, string>)[
			q.id
		];
		const wid = courseNameToWorkspaceUuid[mappedCourse ?? q.course];
		const question = await db
			.insertInto('repo_question')
			.values({
				num: q.id,
				workspace_id: wid,
				creator: q.author ? netidToUuid[q.author] : netidToUuid[defaultAuthor],
				created: new Date(q.created),
				type: 'latex',
				comment: q.comment,
				privilege: mappedCourse ? 128 : 0,
				deleted: !!q.deleted
			})
			.returning('id')
			.executeTakeFirst();

		if (!question) {
			console.log(`Something went wrong making question ${q.id}`);
			continue;
		}

		console.log(`q${q.id} => ${question.id}`);
		qnumToId[q.id] = question.id;

		if (q.type?.length) {
			await db
				.insertInto('repo_question_tag')
				.values({
					question_id: question.id,
					tag_id: tagWidNameToId[wid]['Type:' + q.type]
				})
				.execute();
		}

		if (q.diff?.length) {
			await db
				.insertInto('repo_question_tag')
				.values({
					question_id: question.id,
					tag_id: tagWidNameToId[wid]['Diff:' + q.diff]
				})
				.execute();
		}

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const tags = d.tags.filter((t: any) => t.qid === q.id);

		for (const tag of tags) {
			await db
				.insertInto('repo_question_tag')
				.values({
					question_id: question.id,
					tag_id: tagWidNameToId[wid][tag.tag]
				})
				.execute();
		}

		const media = d.graphics.filter(
			(gfx: any) => gfx.qid === q.id && gfx.content // eslint-disable-line @typescript-eslint/no-explicit-any
		);
		const mediaOnameToHash: Record<string, string> = {};

		for (const gfx of media) {
			const buf = Buffer.from(gfx.content, 'base64');
			const hash = crypto.createHash('sha256');
			hash.update(buf);
			const fileHash = hash.digest('hex');
			mediaOnameToHash[gfx.oname] = fileHash;

			try {
				await s3Client.send(
					new HeadObjectCommand({
						Bucket: process.env.S3_QUESTION_REPO_BUCKET!,
						Key: fileHash
					})
				);
			} catch (e: unknown) {
				if (e instanceof NotFound) {
					const upload = new Upload({
						client: s3Client,
						params: {
							Bucket: process.env.S3_QUESTION_REPO_BUCKET!,
							Key: fileHash,
							Body: buf
						}
					});

					await upload.done();
				}
			}
		}

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const revs = d.questionHistory.filter((qh: any) => qh.qid === q.id);
		let prev = null;

		function replaceContents(c: string) {
			let res = c;
			for (const gfx of media) {
				res = res.replaceAll(gfx.nname, gfx.oname);
			}
			return res;
		}

		for (const rev of revs) {
			await db
				.insertInto('repo_question_rev')
				.values({
					creator: prev
						? prev.author
							? netidToUuid[prev.author]
							: netidToUuid[defaultAuthor]
						: q.author
							? netidToUuid[q.author]
							: netidToUuid[defaultAuthor],
					created: prev ? new Date(prev.time) : new Date(q.created),
					question_id: question.id,
					data: {
						code: replaceContents(rev.prev),
						media: mediaOnameToHash
					}
				})
				.execute();

			prev = rev;
		}

		await db
			.insertInto('repo_question_rev')
			.values({
				creator: prev
					? prev.author
						? netidToUuid[prev.author]
						: netidToUuid[defaultAuthor]
					: q.author
						? netidToUuid[q.author]
						: netidToUuid[defaultAuthor],
				created: prev ? new Date(prev.time) : new Date(q.created),
				question_id: question.id,
				data: {
					code: replaceContents(q.content),
					media: mediaOnameToHash
				}
			})
			.execute();
	}

	console.log(
		'================================================================================'
	);

	console.log('TEMPLATES');
	console.log(
		'================================================================================'
	);

	const templatesToCreate: Record<string, Set<string>> = {};

	for (const q of d.questions) {
		const mappedCourse = (mapping.examQuestions as Record<string, string>)[
			q.id
		];
		const wid = courseNameToWorkspaceUuid[mappedCourse ?? q.course];

		if (!templatesToCreate[wid]) {
			templatesToCreate[wid] = new Set(['Preview']);
		}
	}

	for (const w of d.worksheets) {
		const mappedCourse = (mapping.examWorksheets as Record<string, string>)[
			w.id
		];
		const wid = courseNameToWorkspaceUuid[mappedCourse ?? w.course];

		const template = JSON.parse(w.content).template;
		if (template) {
			if (!templatesToCreate[wid]) {
				templatesToCreate[wid] = new Set(['Preview']);
			}
			templatesToCreate[wid].add(template);
		}
	}

	const templateWidNameToId: Record<string, Record<string, string>> = {};

	for (const wh of d.worksheetHistory) {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const w = d.worksheets.find((w: any) => w.id === wh.wid);
		if (!w) continue;

		const mappedCourse = (mapping.examWorksheets as Record<string, string>)[
			w.id
		];
		const wid = courseNameToWorkspaceUuid[mappedCourse ?? w.course];

		const template = JSON.parse(wh.prev).template;
		if (template) {
			if (!templatesToCreate[wid]) templatesToCreate[wid] = new Set();
			templatesToCreate[wid].add(template);
		}
	}

	for (const [wid, templates] of Object.entries(templatesToCreate)) {
		templateWidNameToId[wid] = {};

		for (const template of templates) {
			if (template === 'preview') continue;

			const existing = await db
				.selectFrom('repo_template')
				.where('workspace_id', '=', wid)
				.where('name', '=', template)
				.select('id')
				.executeTakeFirst();

			if (existing) {
				console.log(`${wid}:${template} => ${existing.id}`);
				templateWidNameToId[wid][template] = existing.id;
				continue;
			}

			const newTemplate = await db
				.insertInto('repo_template')
				.values({
					workspace_id: wid,
					name: template
				})
				.returning('id')
				.executeTakeFirst();

			if (!newTemplate) {
				console.log(
					`Something went wrong making template ${template} in workspace ${wid}`
				);
				continue;
			}

			console.log(`${wid}:${template} => ${newTemplate.id}`);
			templateWidNameToId[wid][template] = newTemplate.id;
		}
	}

	console.log(
		'================================================================================'
	);

	console.log('WORKSHEETS');
	console.log(
		'================================================================================'
	);

	for (const w of d.worksheets) {
		const existing = await db
			.selectFrom('repo_worksheet')
			.where('num', '=', w.id)
			.select('id')
			.executeTakeFirst();

		if (existing) {
			console.log(`w${w.id} => ${existing.id}`);
			continue;
		}

		const mappedCourse = (mapping.examWorksheets as Record<string, string>)[
			w.id
		];
		const wid = courseNameToWorkspaceUuid[mappedCourse ?? w.course];

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const revs = d.worksheetHistory.filter((wh: any) => wh.wid === w.id);

		const worksheet = await db
			.insertInto('repo_worksheet')
			.values({
				num: w.id,
				workspace_id: wid,
				creator: revs.length
					? revs[0].author
						? netidToUuid[revs[0].author]
						: netidToUuid[defaultAuthor]
					: netidToUuid[defaultAuthor],
				created: revs.length ? new Date(revs[0].time) : new Date(w.updated),
				name: w.name,
				privilege: mappedCourse ? 128 : 0,
				deleted: !!w.deleted
			})
			.returning('id')
			.executeTakeFirst();

		if (!worksheet) {
			console.log(`Something went wrong making worksheet ${w.id}`);
			continue;
		}

		console.log(`w${w.id} => ${worksheet.id}`);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		function convertWorksheet(data: any) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const res: any = {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				questions: (data.questions ?? []).map((q: any) => ({
					id: qnumToId[q.fileName]
				}))
			};

			if (data.variables?.length) {
				res.vars = Object.fromEntries(
					data.variables.map((val: string, i: number) => [
						(data.variables.length === 2 ? twoVariables : threeVariables)[i],
						val
					])
				);
			}

			return res;
		}

		let prev = revs[0];

		for (const rev of revs.slice(1)) {
			const data = JSON.parse(rev.prev);

			await db
				.insertInto('repo_worksheet_rev')
				.values({
					creator: prev.author
						? netidToUuid[prev.author]
						: netidToUuid[defaultAuthor],
					created: new Date(prev.time),
					worksheet_id: worksheet.id,
					data: convertWorksheet(data),
					template_id:
						templateWidNameToId[wid][data.template ?? 'Preview'] ??
						templateWidNameToId[wid]['Preview']
				})
				.execute();

			prev = rev;
		}

		if (prev) {
			const data = JSON.parse(w.content);
			const wsData = convertWorksheet(data);

			await db
				.insertInto('repo_worksheet_rev')
				.values({
					creator: prev.author
						? netidToUuid[prev.author]
						: netidToUuid[defaultAuthor],
					created: new Date(w.updated),
					worksheet_id: worksheet.id,
					data: wsData,
					template_id:
						templateWidNameToId[wid][data.template ?? 'Preview'] ??
						templateWidNameToId[wid]['Preview']
				})
				.execute();

			for (const q of wsData.questions) {
				await db
					.insertInto('repo_worksheet_question')
					.values({
						worksheet_id: worksheet.id,
						question_id: q.id
					})
					.onConflict((c) => c.doNothing())
					.execute();
			}
		}
	}

	console.log(
		'================================================================================'
	);
})();

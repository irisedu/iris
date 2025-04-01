import { Router } from 'express';
import { db } from '../../db/index.js';
import { Ollama, type Message } from 'ollama';
import {
	getQuestionTextRange,
	getTextRange,
	IriscFile,
	Question,
	type TextRange
} from '@irisedu/schemas';
import { requireAuth } from '../auth/index.js';

import explainPrompts from './explainPrompts.js';
import simplifyPrompts from './simplifyPrompts.js';
import hintPrompts from './hintPrompts.js';

const ollama = new Ollama({ host: process.env.OLLAMA_HOST });

async function chat(
	messages: Message[],
	followups: Message[],
	chunkHandler?: (frag: string) => void,
	messageEndHandler?: () => void
) {
	messages = [...messages];

	const stream = await ollama.chat({
		model: process.env.OLLAMA_MODEL!,
		messages,
		stream: true
	});

	let assistantMsg: string = '';

	for await (const chunk of stream) {
		assistantMsg += chunk.message.content;
		if (chunkHandler) chunkHandler(chunk.message.content);
	}

	if (messageEndHandler) messageEndHandler();

	if (assistantMsg.length) {
		messages.push({
			role: 'assistant',
			content: assistantMsg
		});
	}

	if (followups.length) {
		followups = [...followups];
		messages.push(followups.shift()!);

		// Don't pass handlers
		return await chat(messages, followups);
	}

	return messages;
}

export const llmRouter = Router();

llmRouter.post('/page/*/:method', requireAuth({}), (req, res, next) => {
	const wildcards = req.params as unknown as string[]; // TODO
	const docPath = wildcards[0];

	const { method } = req.params;

	if (!['explain', 'simplify', 'hint'].includes(method)) {
		res.sendStatus(400);
		return;
	}

	const user = req.session.user;
	if (user?.type !== 'registered') {
		// Impossible
		res.sendStatus(401);
		return;
	}

	const { start, end } = req.query;
	if (!start || !end) {
		res.sendStatus(400);
		return;
	}

	db.selectFrom('document_ptr')
		.where('document_ptr.path', '=', docPath)
		.where('document_ptr.rev', '=', 'latest')
		.innerJoin('document', 'document.id', 'document_ptr.doc_id')
		.select('document.data')
		.select('document.id')
		.executeTakeFirst()
		.then(async (doc) => {
			if (!doc) return res.sendStatus(404);

			let textRange: TextRange | null = null;

			if (docPath.endsWith('.iq.json')) {
				textRange = getQuestionTextRange(
					(doc.data as Question).data,
					start as string,
					end as string
				);
			} else if (docPath.endsWith('.irisc')) {
				textRange = getTextRange(
					(doc.data as IriscFile).data,
					start as string,
					end as string
				);
			}

			if (!textRange) return res.sendStatus(400);

			res.contentType('text/plain');

			if (method === 'explain') {
				if (!textRange.context) return res.sendStatus(400);

				const messages = await chat(
					[
						explainPrompts.system,
						{
							role: 'user',
							content: `QUERY: ${textRange.text}\n\nCONTEXT: ${textRange.context}`
						}
					],
					// explainPrompts.followups,
					[],
					(frag) => {
						res.write(frag);
					},
					() => {
						res.end();
					}
				);
			} else if (method === 'simplify') {
				const messages = await chat(
					[
						simplifyPrompts.system,
						{
							role: 'user',
							content: textRange.text
						}
					],
					simplifyPrompts.followups,
					(frag) => {
						res.write(frag);
					},
					() => {
						res.end();
					}
				);
			} else if (method === 'hint') {
				const messages = await chat(
					[
						hintPrompts.system,
						{
							role: 'user',
							content: `QUERY: ${textRange.text}\n\nCONTEXT: ${textRange.context ?? textRange.text}`
						}
					],
					hintPrompts.followups,
					(frag) => {
						res.write(frag);
					},
					() => {
						res.end();
					}
				);
			}
		})
		.catch(next);
});

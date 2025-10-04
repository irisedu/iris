import { type BackendFeature } from '../../feature.js';
import { type Request, type Response, Router } from 'express';
import { db, type JsonValue } from '../../db/index.js';
import { Ollama, type Message } from 'ollama';
import {
	getQuestionTextRange,
	getTextRange,
	nodesToString,
	type Question,
	type IriscFile,
	type IriscNode,
	type TextRange,
	type QuestionNode,
	QuestionNodeType
} from '@irisedu/schemas';
import { requireAuth } from '../../features/auth/index.js';

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
		stream: true,
		keep_alive: -1
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

async function handleSelectionPrompt(
	docPath: string,
	doc: JsonValue,
	prompt: string,
	req: Request,
	res: Response
) {
	if (!['explain', 'simplify'].includes(prompt)) {
		res.sendStatus(400);
		return;
	}

	const { start, end } = req.query;
	if (!start || !end) {
		res.sendStatus(400);
		return;
	}

	let textRange: TextRange | null = null;

	if (docPath.endsWith('.iq.json')) {
		textRange = getQuestionTextRange(
			(doc as Question).data,
			start as string,
			end as string
		);
	} else if (docPath.endsWith('.irisc')) {
		textRange = getTextRange(
			(doc as IriscFile).data,
			start as string,
			end as string
		);
	}

	if (!textRange) return res.sendStatus(400);

	res.contentType('text/plain');

	if (prompt === 'explain') {
		if (!textRange.context) return res.sendStatus(400);

		await chat(
			[
				{
					role: 'system',
					content: `You are an AI assistant tasked with helping readers to understand difficult terms in documents. Given the query marked by "QUERY:" and the context marked by "CONTEXT:", provide an explanation of the query in context. Ensure that your response sticks to the context provided and does not go off-topic or out-of-scope. Make your explanation at most one paragraph long. Do not repeat the prompt in your response.`
				},

				{
					role: 'user',
					content: `QUERY: ${textRange.text}\n\nCONTEXT: ${textRange.context}`
				}
			],
			[],
			(frag) => {
				res.write(frag);
			},
			() => {
				res.end();
			}
		);
	} else if (prompt === 'simplify') {
		await chat(
			[
				{
					role: 'system',
					content: `You are an AI assistant tasked with simplifying difficult passages. Given a passage, make it easier for beginners to understand. Do not provide any extra output or explanation.`
				},
				{
					role: 'user',
					content: textRange.text
				}
			],
			[],
			(frag) => {
				res.write(frag);
			},
			() => {
				res.end();
			}
		);
	}
}

function getHintText(id: string, nodes: IriscNode[]): string | null {
	for (let i = 0; i < nodes.length; i++) {
		const node = nodes[i];

		if (node.type === 'hint_prompt' && node.attrs?.id === id) {
			let start = i;

			while (start > 0 && nodes[start].type !== 'heading') {
				start--;
			}

			return nodesToString(nodes.slice(start, i));
		} else if (node.content) {
			const childText = getHintText(id, node.content);
			if (childText) return childText;
		}
	}

	return null;
}

function getQuestionHintText(id: string, nodes: QuestionNode[]): string | null {
	for (const node of nodes) {
		if (node.type === QuestionNodeType.Iris) {
			const childText = getHintText(id, node.data);
			if (childText) return childText;
		} else if (node.type === QuestionNodeType.Question) {
			const childText = getQuestionHintText(id, node.contents);
			if (childText) return childText;
		}
	}

	return null;
}

async function handleHintPrompt(
	docPath: string,
	doc: JsonValue,
	prompt: string,
	req: Request,
	res: Response
) {
	if (!['task', 'purpose', 'breakdown'].includes(prompt)) {
		res.sendStatus(400);
		return;
	}

	const { id } = req.query;
	if (!id) {
		res.sendStatus(400);
		return;
	}

	let hintText: string | null = null;

	if (docPath.endsWith('.iq.json')) {
		hintText = getQuestionHintText(id as string, (doc as Question).data);
	} else if (docPath.endsWith('.irisc')) {
		hintText = getHintText(id as string, (doc as IriscFile).data);
	}

	if (!hintText) {
		res.sendStatus(400);
		return;
	}

	if (prompt === 'task') {
		await chat(
			[
				{
					role: 'system',
					content: `You are an AI assistant tasked with providing guidance to readers regarding tasks assigned to them. Given a passage describing the task, provide guidance to the reader clarifying what the task is. Do not provide too much information, for example by revealing the answer.`
				},
				{
					role: 'user',
					content: hintText
				}
			],
			[],
			(frag) => {
				res.write(frag);
			},
			() => {
				res.end();
			}
		);
	} else if (prompt === 'purpose') {
		await chat(
			[
				{
					role: 'system',
					content: `You are an AI assistant tasked with providing guidance to readers regarding tasks assigned to them. Given a passage describing the task, provide guidance to the reader explaining the purpose of the task. Do not provide too much information, for example by revealing the answer.`
				},
				{
					role: 'user',
					content: hintText
				}
			],
			[],
			(frag) => {
				res.write(frag);
			},
			() => {
				res.end();
			}
		);
	} else if (prompt === 'breakdown') {
		await chat(
			[
				{
					role: 'system',
					content: `You are an AI assistant tasked with providing guidance to readers regarding tasks assigned to them. Given a passage describing the task, provide guidance to the reader by breaking the task into a few easily understood parts. Do not provide too much information, for example by revealing the answer.`
				},
				{
					role: 'user',
					content: hintText
				}
			],
			[],
			(frag) => {
				res.write(frag);
			},
			() => {
				res.end();
			}
		);
	}
}

export const router = Router();

router.post(
	'/:method/page/*splat/:prompt',
	requireAuth({}),
	(req, res, next) => {
		const { splat } = req.params as unknown as Record<string, string[]>; // TODO
		const docPath = splat.join('/');

		const { method, prompt } = req.params;

		const user = req.session.user;
		// Impossible
		if (user?.type !== 'registered') return;

		db.selectFrom('document_ptr')
			.where('document_ptr.path', '=', docPath)
			.where('document_ptr.rev', '=', 'latest')
			.innerJoin('document', 'document.id', 'document_ptr.doc_id')
			.select('document.data')
			.select('document.id')
			.executeTakeFirst()
			.then(async (doc) => {
				if (!doc) return res.sendStatus(404);

				if (method === 'selection') {
					await handleSelectionPrompt(docPath, doc.data, prompt, req, res);
				} else if (method === 'hint') {
					await handleHintPrompt(docPath, doc.data, prompt, req, res);
				}
			})
			.catch(next);
	}
);

export const llmFeature = {
	name: 'llm',
	routers: [
		{
			path: '/api/llm',
			router
		}
	]
} satisfies BackendFeature;

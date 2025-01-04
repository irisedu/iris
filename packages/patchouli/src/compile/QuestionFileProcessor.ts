import FileProcessor, { type FileProcessorArgs } from '../FileProcessor.js';
import {
	type Question,
	QuestionFile,
	type QuestionNode,
	QuestionNodeType
} from '@irisedu/schemas';
import FileInfo from '../FileInfo.js';
import path from 'path';
import fs from 'fs-extra';
import { processIrisNodes } from './IrisFileProcessor.js';

function processQuestionNode(
	node: QuestionNode,
	fileInfo: FileInfo
): QuestionNode {
	switch (node.type) {
		case QuestionNodeType.Question:
			return {
				...node,
				contents: processQuestionNodes(node.contents, fileInfo)
			};

		case QuestionNodeType.Iris:
			return {
				...node,
				data: processIrisNodes(node.data, {}, fileInfo, {})
			};

		case QuestionNodeType.MCQ:
			return {
				...node,
				options: node.options.map((opt) => ({
					...opt,
					label: processIrisNodes(opt.label, {}, fileInfo, {}),
					explanation: opt.explanation
						? processIrisNodes(opt.explanation, {}, fileInfo, {})
						: undefined
				}))
			};

		case QuestionNodeType.FillInTheBlank:
			return {
				...node,
				prompt: processIrisNodes(node.prompt, {}, fileInfo, {}),
				blanks: node.blanks.map((blank) => ({
					...blank,
					catchAllExplanation: blank.catchAllExplanation
						? processIrisNodes(blank.catchAllExplanation, {}, fileInfo, {})
						: undefined,
					options: blank.options.map((opt) => ({
						...opt,
						explanation: opt.explanation
							? processIrisNodes(opt.explanation, {}, fileInfo, {})
							: undefined
					}))
				}))
			};

		case QuestionNodeType.FreeResponse:
			return {
				...node,
				catchAllExplanation: node.catchAllExplanation
					? processIrisNodes(node.catchAllExplanation, {}, fileInfo, {})
					: undefined,
				options: node.options.map((opt) => ({
					...opt,
					explanation: opt.explanation
						? processIrisNodes(opt.explanation, {}, fileInfo, {})
						: undefined
				}))
			};
	}
}

function processQuestionNodes(
	nodes: QuestionNode[],
	fileInfo: FileInfo
): QuestionNode[] {
	return nodes.map((n) => processQuestionNode(n, fileInfo));
}

export default class QuestionFileProcessor extends FileProcessor {
	override async process({ inDir, outDir, filePath }: FileProcessorArgs) {
		const inPath = path.join(inDir, filePath);
		const outPath = path.join(
			outDir,
			QuestionFileProcessor.getOutputPath(filePath)
		);

		const fileInfo = new FileInfo(filePath);

		const data = QuestionFile.parse(
			JSON.parse(await fs.readFile(inPath, 'utf-8'))
		);

		if (data.version !== 1) {
			fileInfo.message({
				id: 'iq-version-mismatch',
				message: `Invalid question file version (${data.version})`
			});

			return fileInfo;
		}

		const question = data.data;

		const newFile: Question = {
			meta: question.meta,
			data: processQuestionNodes(question.data, fileInfo)
		};

		await fs.ensureDir(path.dirname(outPath));
		await fs.writeFile(outPath, JSON.stringify(newFile));
		return fileInfo;
	}

	override handlesFile(filePath: string) {
		return filePath.endsWith('.irisq.json');
	}

	static override getOutputPath(filePath: string) {
		return filePath.slice(0, -11) + '.iq.json';
	}
}

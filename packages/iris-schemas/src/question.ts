/*
 * Purpose: Shared schema for Iris-compatible questions between platforms
 */

import { z } from 'zod';
import { IriscNode } from './irisc.js';

//////////
// Base //
//////////

export enum QuestionNodeType {
	Question = 0,
	Iris,
	MCQ,
	FillInTheBlank,
	FreeResponse
}

export const QuestionNodeTypeT = z.nativeEnum(QuestionNodeType);

export const QuestionNodeBase = z.object({
	id: z.string().uuid(),
	type: QuestionNodeTypeT
});

export type QuestionNodeBase = z.infer<typeof QuestionNodeBase>;

export const QuestionNodePointsBase = QuestionNodeBase.extend({
	points: z.number().gte(0)
});

export type QuestionNodePointsBase = z.infer<typeof QuestionNodePointsBase>;

///////////////
// Recursion //
///////////////

const QuestionChildNodeBase = QuestionNodeBase.extend({
	type: z.literal(QuestionNodeType.Question)
});

export type QuestionChildNode = z.infer<typeof QuestionChildNodeBase> & {
	contents: QuestionNode[];
};

export const QuestionChildNode: z.ZodType<QuestionChildNode> =
	QuestionChildNodeBase.extend({
		contents: z.lazy(() => QuestionNode.array())
	});

//////////////////
// Text content //
//////////////////

export const IrisQuestionNode = QuestionNodeBase.extend({
	type: z.literal(QuestionNodeType.Iris),
	data: IriscNode.array() // Block
});

export type IrisQuestionNode = z.infer<typeof IrisQuestionNode>;

/////////
// MCQ //
/////////

export const MultipleChoiceQuestionNode = QuestionNodePointsBase.extend({
	type: z.literal(QuestionNodeType.MCQ),
	options: z
		.object({
			id: z.string().uuid(),
			label: IriscNode.array(), // Block
			correct: z.boolean(),
			explanation: z.optional(IriscNode.array()) // Block
		})
		.array(),
	multipleResponse: z.optional(z.boolean())
});

export type MultipleChoiceQuestionNode = z.infer<
	typeof MultipleChoiceQuestionNode
>;

///////////////////////
// Fill in the blank //
///////////////////////

export const FillInTheBlankQuestionNode = QuestionNodePointsBase.extend({
	type: z.literal(QuestionNodeType.FillInTheBlank),
	prompt: IriscNode.array(), // Block, contains blanks with ids
	blanks: z
		.object({
			id: z.string().uuid(),
			validator: z.optional(z.string()),
			validatorMessage: z.optional(z.string()),
			options: z
				.object({
					id: z.string().uuid(),
					value: z.string().min(0),
					correct: z.boolean(),
					explanation: z.optional(IriscNode.array()) // Block
				})
				.array(),
			catchAllExplanation: z.optional(IriscNode.array()) // Block
		})
		.array()
});

export type FillInTheBlankQuestionNode = z.infer<
	typeof FillInTheBlankQuestionNode
>;

/////////
// FRQ //
/////////

export const FreeResponseQuestionNode = QuestionNodePointsBase.extend({
	type: z.literal(QuestionNodeType.FreeResponse),
	multiline: z.boolean(),
	validator: z.optional(z.string()),
	validatorMessage: z.optional(z.string()),
	options: z
		.object({
			id: z.string().uuid(),
			value: z.string(),
			correct: z.boolean(),
			explanation: z.optional(IriscNode.array()) // Block
		})
		.array(),
	catchAllExplanation: z.optional(IriscNode.array()) // Block
});

export type FreeResponseQuestionNode = z.infer<typeof FreeResponseQuestionNode>;

//////////////
// Metadata //
//////////////

export const QuestionTopic = z.object({
	id: z.string().uuid(),
	name: z.string()
});

export type QuestionTopic = z.infer<typeof QuestionTopic>;

//////////////
// Question //
//////////////

export const QuestionNode = z.union([
	QuestionChildNode,
	IrisQuestionNode,
	MultipleChoiceQuestionNode,
	FillInTheBlankQuestionNode,
	FreeResponseQuestionNode
]);

export type QuestionNode = z.infer<typeof QuestionNode>;

export const QuestionMetadata = z.object({
	userdata: z.optional(z.record(z.string(), z.unknown())),
	topics: z.optional(QuestionTopic.array()),
	comment: z.optional(z.string())
});

export type QuestionMetadata = z.infer<typeof QuestionMetadata>;

export const Question = z.object({
	meta: QuestionMetadata,
	data: QuestionNode.array()
});

export type Question = z.infer<typeof Question>;

export const QuestionFile = z.object({
	version: z.number().int(),
	data: Question
});

export type QuestionFile = z.infer<typeof QuestionFile>;

////////////////
// Submission //
////////////////

export const MultipleChoiceQuestionResponse = z.object({
	type: z.literal(QuestionNodeType.MCQ),
	choices: z.string().uuid().array()
});

export type MultipleChoiceQuestionResponse = z.infer<
	typeof MultipleChoiceQuestionResponse
>;

export const FillInTheBlankQuestionResponse = z.object({
	type: z.literal(QuestionNodeType.FillInTheBlank),
	blanks: z.record(z.string().uuid(), z.string())
});

export type FillInTheBlankQuestionResponse = z.infer<
	typeof FillInTheBlankQuestionResponse
>;

export const FreeResponseQuestionResponse = z.object({
	type: z.literal(QuestionNodeType.FreeResponse),
	response: z.string()
});

export type FreeResponseQuestionResponse = z.infer<
	typeof FreeResponseQuestionResponse
>;

export const QuestionResponse = z.union([
	MultipleChoiceQuestionResponse,
	FillInTheBlankQuestionResponse,
	FreeResponseQuestionResponse
]);

export type QuestionResponse = z.infer<typeof QuestionResponse>;

export const QuestionSubmission = z.record(z.string().uuid(), QuestionResponse);

export type QuestionSubmission = z.infer<typeof QuestionSubmission>;

/////////////
// Outcome //
/////////////

export const MultipleChoiceQuestionGrade = z.object({
	type: z.literal(QuestionNodeType.MCQ),
	options: z.record(
		z.string().uuid(),
		z.object({
			correct: z.boolean(),
			explanation: z.optional(IriscNode.array())
		})
	),
	missingResponses: z.optional(z.boolean()), // multipleResponse only
	points: z.number().gte(0)
});

export type MultipleChoiceQuestionGrade = z.infer<
	typeof MultipleChoiceQuestionGrade
>;

export const FillInTheBlankQuestionGrade = z.object({
	type: z.literal(QuestionNodeType.FillInTheBlank),
	blanks: z.record(
		z.string().uuid(),
		z.object({
			correct: z.boolean(),
			explanation: z.optional(IriscNode.array())
		})
	),
	points: z.number().gte(0)
});

export type FillInTheBlankQuestionGrade = z.infer<
	typeof FillInTheBlankQuestionGrade
>;

export const FreeResponseQuestionGrade = z.object({
	type: z.literal(QuestionNodeType.FreeResponse),
	correct: z.boolean(),
	explanation: z.optional(IriscNode.array()),
	points: z.number().gte(0)
});

export const QuestionGrade = z.union([
	MultipleChoiceQuestionGrade,
	FillInTheBlankQuestionGrade,
	FreeResponseQuestionGrade
]);

export type QuestionGrade = z.infer<typeof QuestionGrade>;

export const QuestionOutcome = z.record(z.string().uuid(), QuestionGrade);

export type QuestionOutcome = z.infer<typeof QuestionOutcome>;

///////////////
// Utilities //
///////////////

export function ensurePoints(q: QuestionNode): QuestionNodePointsBase | null {
	if (q.type !== QuestionNodeType.Question && q.type !== QuestionNodeType.Iris)
		return q;

	return null;
}

export function getTotalPoints(q: Question) {
	function getNodesPoints(qs: QuestionNode[]) {
		let points = 0;

		for (const qn of qs) {
			if (qn.type === QuestionNodeType.Question) {
				points += getNodesPoints(qn.contents);
			} else {
				const pts = ensurePoints(qn);
				if (pts) points += pts.points;
			}
		}

		return points;
	}

	return getNodesPoints(q.data);
}

export function gradeQuestionNode(
	q: QuestionNode,
	s: QuestionResponse
): QuestionGrade | null {
	switch (q.type) {
		case QuestionNodeType.MCQ: {
			if (s.type !== q.type) return null;

			const chosenOptions = s.choices
				.map((c) => q.options.find((o) => o.id === c))
				.filter((o) => o !== undefined);

			const options: MultipleChoiceQuestionGrade['options'] = {};

			if (q.multipleResponse) {
				const choicesSet = new Set(s.choices);
				const correctChoices = chosenOptions.filter((co) => co.correct);
				const omissions = q.options.filter((o) => !choicesSet.has(o.id));
				const correctOmissions = omissions.filter((o) => !o.correct);

				chosenOptions.forEach(
					(co) =>
						(options[co.id] = {
							correct: co.correct,
							explanation: co.explanation
						})
				);

				const points =
					q.points *
					((correctChoices.length + correctOmissions.length) /
						q.options.length);

				return {
					type: q.type,
					options,
					missingResponses: omissions.length > correctOmissions.length,
					points
				};
			} else {
				if (chosenOptions.length !== 1) return null;

				const opt = chosenOptions[0];

				options[opt.id] = {
					correct: opt.correct,
					explanation: opt.explanation
				};

				return {
					type: q.type,
					options,
					points: opt.correct ? q.points : 0
				};
			}
		}
		case QuestionNodeType.FillInTheBlank: {
			if (s.type !== q.type) return null;

			const blanks: FillInTheBlankQuestionGrade['blanks'] = {};
			let numCorrect = 0;

			for (const blank of q.blanks) {
				const resp = s.blanks[blank.id];
				if (!resp) {
					blanks[blank.id] = {
						correct: false,
						explanation: blank.catchAllExplanation
					};

					continue;
				}

				const opt = blank.options.find((o) => o.value === resp);

				if (opt?.correct) numCorrect++;

				blanks[blank.id] = {
					correct: opt?.correct ?? false,
					explanation: opt?.explanation ?? blank.catchAllExplanation
				};
			}

			return {
				type: q.type,
				blanks,
				points: q.points * (numCorrect / q.blanks.length)
			};
		}
		case QuestionNodeType.FreeResponse: {
			if (s.type !== q.type) return null;

			const opt = q.options.find((o) => o.value === s.response);

			return {
				type: q.type,
				correct: opt?.correct ?? false,
				explanation: opt?.explanation ?? q.catchAllExplanation,
				points: opt?.correct ? q.points : 0
			};
		}
	}

	return null;
}

export function gradeQuestion(
	q: Question,
	s: QuestionSubmission
): QuestionOutcome {
	const outcome: QuestionOutcome = {};

	function gradeQuestionNodes(qn: QuestionNode[]) {
		for (const n of qn) {
			if (n.type === QuestionNodeType.Question) {
				gradeQuestionNodes(n.contents);
			} else {
				const grade = gradeQuestionNode(n, s[n.id]);
				if (grade) outcome[n.id] = grade;
			}
		}
	}

	gradeQuestionNodes(q.data);
	return JSON.parse(JSON.stringify(outcome)); // strip undefined
}

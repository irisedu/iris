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

///////////////
// Utilities //
///////////////

export function ensurePoints(q: QuestionNode): QuestionNodePointsBase | null {
	if (q.type !== QuestionNodeType.Question && q.type !== QuestionNodeType.Iris)
		return q;

	return null;
}

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
	type: QuestionNodeTypeT,
	points: z.optional(z.number().gte(0))
});

export type QuestionNodeBase = z.infer<typeof QuestionNodeBase>;

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

export const MultipleChoiceQuestionNode = QuestionNodeBase.extend({
	type: z.literal(QuestionNodeType.MCQ),
	options: z
		.object({
			id: z.string().uuid(),
			label: IriscNode.array(), // Inline
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

export const FillInTheBlankQuestionNode = QuestionNodeBase.extend({
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
				.array()
		})
		.array(),
	catchAllExplanation: z.optional(IriscNode.array()) // Block
});

export type FillInTheBlankQuestionNode = z.infer<
	typeof FillInTheBlankQuestionNode
>;

/////////
// FRQ //
/////////

export const FreeResponseQuestionNode = QuestionNodeBase.extend({
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
	topics: z.optional(z.string().array())
});

export type QuestionMetadata = z.infer<typeof QuestionMetadata>;

export const Question = z.object({
	meta: QuestionMetadata,
	data: QuestionNode.array()
});

export type Question = z.infer<typeof Question>;

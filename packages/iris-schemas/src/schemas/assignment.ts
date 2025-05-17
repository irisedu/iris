/*
 * Purpose: Transport assignment data from another platform to Iris
 */

import { z } from 'zod';
import { Question } from './question.js';

export const AssignmentMetadata = z.object({
	id: z.string().uuid(),
	name: z.string(),

	dateAssigned: z.number(), // epoch (ms)
	dateDue: z.number(),

	immediateFeedback: z.boolean()
});

export type AssignmentMetadata = z.infer<typeof AssignmentMetadata>;

export const Assignment = z.object({
	meta: AssignmentMetadata,
	data: Question.array()
});

export type Assignment = z.infer<typeof Assignment>;

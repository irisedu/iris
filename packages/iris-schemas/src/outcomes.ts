/*
 * Purpose: Transport outcome data from Iris to other platforms
 */

import { z } from 'zod';

export const JudgeSubmission = z.object({
	assignmentId: z.string().uuid(),
	dateSubmitted: z.number()
	// TODO
});

export type JudgeSubmission = z.infer<typeof JudgeSubmission>;

export const JudgeResult = z.object({
	scorePercent: z.number()
	// TODO: timeline/analytics
	// TODO
});

export type JudgeResult = z.infer<typeof JudgeResult>;

export const AssignmentOutcome = z.object({
	submission: JudgeSubmission,
	data: JudgeResult
});

export type AssignmentOutcome = z.infer<typeof AssignmentOutcome>;

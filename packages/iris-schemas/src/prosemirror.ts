import { z } from 'zod';

const Attrs = z.optional(z.record(z.string(), z.unknown()));

// Mark

export const IrisMark = z.object({
	type: z.string(),
	attrs: Attrs
});

export type IrisMark = z.infer<typeof IrisMark>;

// Node

export const IrisNodeBase = z.object({
	type: z.string(),
	attrs: Attrs,
	marks: z.optional(IrisMark.array()),
	text: z.optional(z.string())
});

export type IrisNode = z.infer<typeof IrisNodeBase> & {
	content?: IrisNode[];
};

export const IrisNode: z.ZodType<IrisNode> = IrisNodeBase.extend({
	content: z.lazy(() => z.optional(IrisNode.array()))
});

// File

export const IrisFile = z.object({
	version: z.number().int(),
	data: IrisNode
});

export type IrisFile = z.infer<typeof IrisFile>;

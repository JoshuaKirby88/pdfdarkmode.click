import { z } from "zod"

export const convertPdfPageRequestSchema = z.object({
	base64Page: z.string().min(1, "base64Page is required"),
})

export const convertPdfPageSuccessSchema = z.object({
	success: z.literal(true),
	markdown: z.string(),
	cost: z.number().optional(),
})

export const convertPdfPageErrorSchema = z.object({
	success: z.literal(false),
	error: z.string(),
})

export const convertPdfPageResponseSchema = z.union([convertPdfPageSuccessSchema, convertPdfPageErrorSchema])

export type ConvertPdfPageRequest = z.infer<typeof convertPdfPageRequestSchema>
export type ConvertPdfPageResponse = z.infer<typeof convertPdfPageResponseSchema>

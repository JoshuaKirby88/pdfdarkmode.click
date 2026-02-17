import { createFetch } from "@better-fetch/fetch"
import { type ConvertPdfPageResponse, convertPdfPageRequestSchema, convertPdfPageResponseSchema } from "@/lib/api/convert-pdf-page-contract"

const apiFetch = createFetch()

export async function convertPdfPageToMarkdown(base64Page: string): Promise<ConvertPdfPageResponse> {
	const body = convertPdfPageRequestSchema.parse({ base64Page })

	const response = await apiFetch("/api/convert-pdf-page", {
		method: "POST",
		body,
		output: convertPdfPageResponseSchema,
	})

	if (response.error) {
		const message = typeof response.error.message === "string" ? response.error.message : "Failed to convert page"
		return {
			success: false,
			error: message,
		}
	}

	return response.data
}

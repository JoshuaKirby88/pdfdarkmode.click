import { NextResponse } from "next/server"
import { type ConvertPdfPageResponse, convertPdfPageRequestSchema, convertPdfPageResponseSchema } from "@/lib/api/convert-pdf-page-contract"
import { convertSinglePageToMarkdown } from "@/lib/server/convert-single-page-to-markdown"

const HTTP_OK = 200
const HTTP_BAD_REQUEST = 400
const HTTP_INTERNAL_SERVER_ERROR = 500

function jsonResponse(payload: ConvertPdfPageResponse, status: number) {
	return NextResponse.json(convertPdfPageResponseSchema.parse(payload), { status })
}

export async function POST(request: Request) {
	let requestBody: unknown
	try {
		requestBody = await request.json()
	} catch {
		return jsonResponse({ success: false, error: "Invalid JSON body" }, HTTP_BAD_REQUEST)
	}

	const parsedBody = convertPdfPageRequestSchema.safeParse(requestBody)
	if (!parsedBody.success) {
		return jsonResponse({ success: false, error: "Invalid request body" }, HTTP_BAD_REQUEST)
	}

	try {
		const result = await convertSinglePageToMarkdown(parsedBody.data.base64Page)
		return jsonResponse(
			{
				success: true,
				markdown: result.markdown,
				cost: result.cost,
			},
			HTTP_OK
		)
	} catch (error) {
		return jsonResponse(
			{
				success: false,
				error: error instanceof Error ? error.message : "Failed to convert page",
			},
			HTTP_INTERNAL_SERVER_ERROR
		)
	}
}

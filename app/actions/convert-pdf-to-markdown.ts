"use server"

import { generateText } from "ai"

async function pdfSourceToBase64(src: File | string): Promise<string> {
	let arrayBuffer: ArrayBuffer

	if (src instanceof File) {
		arrayBuffer = await src.arrayBuffer()
	} else if (src.startsWith("data:")) {
		return src.split(",")[1] ?? ""
	} else {
		const res = await fetch(src)
		if (!res.ok) {
			throw new Error(`Failed to fetch PDF (${res.status})`)
		}
		arrayBuffer = await res.arrayBuffer()
	}

	const bytes = new Uint8Array(arrayBuffer)
	let binary = ""
	for (let i = 0; i < bytes.byteLength; i++) {
		binary += String.fromCharCode(bytes[i])
	}
	return btoa(binary)
}

export async function convertPdfToMarkdown(pdfSource: File | string, _totalPages: number): Promise<{ success: boolean; markdown?: string; error?: string; cost?: number }> {
	try {
		const base64Pdf = await pdfSourceToBase64(pdfSource)

		const result = await generateText({
			model: "gemini-2.5-flash-lite",
			messages: [
				{
					role: "user",
					content: [
						{
							type: "text",
							text: "Convert this entire PDF document to markdown. Extract all text accurately, preserve formatting, structure, headings, lists, and tables. Convert any images to descriptive text. Output only the markdown content.",
						},
						{
							type: "file",
							data: Buffer.from(base64Pdf, "base64"),
							mediaType: "application/pdf",
						},
					],
				},
			],
		})

		let cost: number | undefined
		try {
			const steps = (result as any).steps
			if (Array.isArray(steps) && steps.length > 0) {
				const costString = steps[0]?.providerMetadata?.gateway?.cost
				if (typeof costString === "string") {
					const parsedCost = Number.parseFloat(costString)
					if (!Number.isNaN(parsedCost)) {
						cost = parsedCost
					}
				}
			}
		} catch {}

		return {
			success: true,
			markdown: result.text,
			cost,
		}
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : "Failed to convert PDF to markdown",
		}
	}
}

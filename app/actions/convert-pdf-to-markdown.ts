"use server"

import { generateText } from "ai"

const systemPrompt = `Convert this PDF page to markdown. Extract all text accurately, preserve formatting, structure, headings, lists, and tables.
Heading: Judge heading based on text size. You're given a cut-out of a larger PDF, so first sentence might not be the title.
Sentences: When a single sentence spans multiple lines due to PDF formatting or width constraints, merge them into a single line.
Images: Convert any images to descriptive text.
Code: Wrap ALL code within the PDF using tripple backticks (\`\`\`) or single backticks (\`).
Page Numbers: Don't add page numbers. If already present (a single number floating at the bottom), strip it.
Empty Pages: If a page has no visible content (blank or whitespace only), return empty text for that page.

Final Output: Only return the actual content from the PDF.`

async function convertSinglePageToMarkdown(base64PagePdf: string): Promise<{ markdown: string; cost?: number }> {
	const result = await generateText({
		model: "gemini-2.5-flash-lite",
		messages: [
			{ role: "system", content: systemPrompt },
			{
				role: "user",
				content: [
					{
						type: "file",
						data: Buffer.from(base64PagePdf, "base64"),
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
	} catch { }

	// Strip markdown code block wrapper if present (only ```markdown, not generic ```)
	let markdown = result.text.trim()
	if (markdown.startsWith("```markdown\n") && markdown.endsWith("\n```")) {
		markdown = markdown.slice("```markdown\n".length, -"\n```".length)
	} else if (markdown.startsWith("```markdown") && markdown.endsWith("```")) {
		markdown = markdown.slice("```markdown".length, -"```".length).trim()
	}

	return {
		markdown: markdown.trim(),
		cost,
	}
}

export async function convertPdfToMarkdown(pageBuffers: string[], totalPages: number): Promise<{ success: boolean; markdown?: string; error?: string; cost?: number }> {
	try {
		// Process all pages in parallel
		const results = await Promise.all(pageBuffers.map(base64Page => convertSinglePageToMarkdown(base64Page)))

		// Concatenate markdown
		const markdown = results.map(r => r.markdown).join("\n\n")

		// Sum all page costs
		const totalCost = results.reduce((sum, r) => sum + (r.cost || 0), 0)

		return {
			success: true,
			markdown,
			cost: totalCost,
		}
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : "Failed to convert PDF to markdown",
		}
	}
}

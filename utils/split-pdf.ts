import { PDFDocument } from "pdf-lib"

async function sourceToArrayBuffer(src: File | string): Promise<ArrayBuffer> {
	if (src instanceof File) {
		return src.arrayBuffer()
	}
	if (src.startsWith("data:")) {
		const base64 = src.split(",")[1] ?? ""
		const binary = atob(base64)
		const bytes = new Uint8Array(binary.length)
		for (let i = 0; i < binary.length; i++) {
			bytes[i] = binary.charCodeAt(i)
		}
		return bytes.buffer
	}
	const res = await fetch(src)
	if (!res.ok) {
		throw new Error(`Failed to fetch PDF (${res.status})`)
	}
	return res.arrayBuffer()
}

export async function splitPdfIntoPageBuffers(pdfSource: File | string): Promise<Uint8Array[]> {
	const srcBytes = await sourceToArrayBuffer(pdfSource)
	const srcDoc = await PDFDocument.load(srcBytes)
	const pageCount = srcDoc.getPageCount()
	const pageBuffers: Uint8Array[] = []

	for (let i = 0; i < pageCount; i++) {
		const singlePagePdf = await PDFDocument.create()
		const [copiedPage] = await singlePagePdf.copyPages(srcDoc, [i])
		singlePagePdf.addPage(copiedPage)
		const bytes = await singlePagePdf.save()
		pageBuffers.push(bytes)
	}

	return pageBuffers
}

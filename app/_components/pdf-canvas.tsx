"use client"

import { useState } from "react"
import { Document, Page, pdfjs } from "react-pdf"
import { usePDFZustand } from "@/zustand/pdf-zustand"
import "react-pdf/dist/Page/TextLayer.css"
import "react-pdf/dist/esm/Page/AnnotationLayer.css"
import { toast } from "sonner"

pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString()

const config = {
	width: 1200,
	documentOptions: {
		cMapUrl: "/cmaps/",
	},
}

export const PDFCanvas = (props: { pdf: File | string }) => {
	const [pages, setPages] = useState(0)
	const [width] = useState(Math.min(config.width, window.innerWidth))

	const onLoadSuccess = (input: { numPages: number }) => {
		setPages(input.numPages)
		setDocumentTitle()
	}

	const onError = (err: Error) => {
		toast.error(err.message)
		usePDFZustand.setState({ pdf: null })
	}

	const setDocumentTitle = () => {
		let title: string | null = null

		if (props.pdf instanceof File) {
			title = props.pdf.name
		} else if (typeof props.pdf === "string" && !props.pdf.startsWith("data:")) {
			try {
				const url = new URL(props.pdf, window.location.href)
				const last = url.pathname.split("/").pop() || ""
				title = last ? decodeURIComponent(last) : null
			} catch {
				const cleaned = props.pdf.split("?")[0].split("#")[0]
				const last = cleaned.split("/").pop() || ""
				title = last ? decodeURIComponent(last) : null
			}
		}

		if (title?.trim()) {
			document.title = title
		}
	}

	return (
		<div className="absolute inset-0 overflow-auto dark:invert">
			<Document
				className="flex flex-col items-center"
				error={null}
				file={props.pdf}
				loading=""
				onLoadError={onError}
				onLoadSuccess={onLoadSuccess}
				onSourceError={onError}
				options={config.documentOptions}
			>
				{new Array(pages).fill(0).map((_, i) => (
					<Page key={i} pageNumber={i + 1} width={width} />
				))}
			</Document>
		</div>
	)
}

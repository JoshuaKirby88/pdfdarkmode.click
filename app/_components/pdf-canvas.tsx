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
	}

	const onError = (err: Error) => {
		toast.error(err.message)
		usePDFZustand.setState({ pdf: null })
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

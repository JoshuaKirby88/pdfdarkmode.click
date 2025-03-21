import { useState } from "react"
import { pdfjs } from "react-pdf"
import { Document, Page } from "react-pdf"
import "react-pdf/dist/Page/TextLayer.css"
import "react-pdf/dist/esm/Page/AnnotationLayer.css"

pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString()

const documentOptions = {
	cMapUrl: "/cmaps/",
}

export const PDFCanvas = (props: { pdfLink: string }) => {
	const [pages, setPages] = useState(0)
	const [width] = useState(Math.min(1200, window.innerWidth))

	const onLoadSuccess = (input: { numPages: number }) => {
		setPages(input.numPages)
	}

	return (
		<div className="absolute inset-0 overflow-auto dark:invert">
			<Document file={props.pdfLink} onLoadSuccess={onLoadSuccess} options={documentOptions} loading="" className="flex flex-col items-center">
				{Array(pages)
					.fill(0)
					.map((_, i) => (
						<Page key={i} pageNumber={i + 1} width={width} />
					))}
			</Document>
		</div>
	)
}

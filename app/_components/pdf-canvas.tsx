"use client"

import { useEffect, useState } from "react"
import { Document, Page, pdfjs } from "react-pdf"
import { usePDFZustand } from "@/zustand/pdf-zustand"
import "react-pdf/dist/Page/TextLayer.css"
import "react-pdf/dist/esm/Page/AnnotationLayer.css"
import { toast } from "sonner"

pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString()

const config = {
	documentOptions: {
		cMapUrl: "/cmaps/",
	},
}

const getFilenameFromUrlString = (input: string): string | null => {
	try {
		const url = new URL(input, window.location.href)
		const last = url.pathname.split("/").pop() || ""
		return last ? decodeURIComponent(last) : null
	} catch {
		const cleaned = input.split("?")[0].split("#")[0]
		const last = cleaned.split("/").pop() || ""
		return last ? decodeURIComponent(last) : null
	}
}

const deriveTitle = (source: File | string): string | null => {
	if (source instanceof File) {
		return source.name
	}
	if (typeof source === "string" && !source.startsWith("data:")) {
		return getFilenameFromUrlString(source)
	}
	return null
}

export const PDFCanvas = (props: { pdf: File | string }) => {
	const [pages, setPages] = useState(0)
	const [viewport, setViewport] = useState({ width: window.innerWidth, height: window.innerHeight })
	const [pageDims, setPageDims] = useState<Record<number, { width: number; height: number }>>({})
	useEffect(() => {
		const update = () => setViewport({ width: window.innerWidth, height: window.innerHeight })
		update()
		window.addEventListener("resize", update)
		window.addEventListener("orientationchange", update)
		return () => {
			window.removeEventListener("resize", update)
			window.removeEventListener("orientationchange", update)
		}
	}, [])

	const onLoadSuccess = (input: { numPages: number }) => {
		setPages(input.numPages)
		setDocumentTitle()
	}

	const onError = (err: Error) => {
		toast.error(err.message)
		usePDFZustand.setState({ pdf: null })
	}

	const setDocumentTitle = () => {
		const title = deriveTitle(props.pdf)
		if (title?.trim()) {
			document.title = title
		}
	}

	return (
		<div className="absolute inset-0 snap-y snap-mandatory overflow-x-hidden overflow-y-scroll bg-white dark:invert">
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
				{Array.from({ length: pages }, (_, index) => index + 1).map(pageNumber => {
					const dims = pageDims[pageNumber]
					const fitWidth = dims ? Math.min(viewport.width, (viewport.height * dims.width) / dims.height) : Math.min(viewport.width, viewport.height)
					return (
						<div className="flex h-screen w-screen snap-start items-center justify-center overflow-hidden" key={`page-${pageNumber}`}>
							<Page
								onLoadSuccess={(page: any) => {
									const vp = page.getViewport({ scale: 1 })
									setPageDims(prev => ({
										...prev,
										[pageNumber]: { width: vp.width, height: vp.height },
									}))
								}}
								pageNumber={pageNumber}
								width={Math.floor(fitWidth)}
							/>
						</div>
					)
				})}
			</Document>
		</div>
	)
}

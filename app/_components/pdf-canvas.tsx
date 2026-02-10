"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Document, Page, pdfjs } from "react-pdf"
import { usePDFZustand } from "@/zustand/pdf-zustand"
import "react-pdf/dist/Page/TextLayer.css"
import "react-pdf/dist/esm/Page/AnnotationLayer.css"
import { FileText, Maximize2, Minimize2 } from "lucide-react"
import { toast } from "sonner"
import { isInputFocused, useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts"
import ExportPagesDialog from "./export-pages-dialog"
import MarkdownDialog from "./markdown-dialog"
import { PageIndicator } from "./page-indicator"

pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString()

const config = {
	documentOptions: {
		cMapUrl: "/cmaps/",
	},
}

const INTERSECTION_STEPS = 100
const PAGE_INPUT_TIMEOUT_MS = 500
type PageViewport = { width: number; height: number }
type PageLike = { getViewport: (opts: { scale: number }) => PageViewport }

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
	const fitMode = usePDFZustand(state => state.fitMode)
	const toggleFitMode = usePDFZustand(state => state.toggleFitMode)
	const openMarkdownDialog = usePDFZustand(state => state.openMarkdownDialog)
	const currentPage = usePDFZustand(state => state.currentPage)

	const rootRef = useRef<HTMLDivElement | null>(null)
	const inputTimeoutRef = useRef<NodeJS.Timeout | null>(null)
	const currentInputRef = useRef<string>("")
	const isScrollingRef = useRef(false)
	const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)

	const scrollToPage = useCallback(
		(pageNumber: number) => {
			if (!rootRef.current || pageNumber < 1 || pageNumber > pages) {
				return
			}

			const pageElement = rootRef.current.querySelector(`[data-page="${pageNumber}"]`) as HTMLElement
			if (pageElement) {
				isScrollingRef.current = true
				if (scrollTimeoutRef.current) {
					clearTimeout(scrollTimeoutRef.current)
				}
				
				usePDFZustand.setState({ currentPage: pageNumber })
				pageElement.scrollIntoView({ behavior: "smooth", block: "start" })
				
				scrollTimeoutRef.current = setTimeout(() => {
					isScrollingRef.current = false
				}, 1000)
			}
		},
		[pages]
	)

	useKeyboardShortcuts(
		[
			{
				key: "ctrl+x+m",
				handler: e => {
					e.preventDefault()
					e.stopPropagation()
					openMarkdownDialog()
				},
				priority: 10,
			},

			{
				key: "ctrl+x+f",
				handler: e => {
					e.preventDefault()
					e.stopPropagation()
					toggleFitMode()
				},
				priority: 10,
			},

			{
				key: "arrowup",
				handler: e => {
					const current = usePDFZustand.getState().currentPage
					if (isInputFocused()) {
						return
					}

					e.preventDefault()
					
					if (current < 1 || current > pages) {
						return
					}

					const targetPage = current - 1
					if (targetPage < 1 || targetPage > pages) {
						return
					}

					scrollToPage(targetPage)
				},
				priority: 8,
			},

			{
				key: "arrowdown",
				handler: e => {
					const current = usePDFZustand.getState().currentPage
					if (isInputFocused()) {
						return
					}

					e.preventDefault()
					
					if (current < 1 || current > pages) {
						return
					}

					const targetPage = current + 1
					if (targetPage < 1 || targetPage > pages) {
						return
					}

					scrollToPage(targetPage)
				},
				priority: 8,
			},

			...Array.from({ length: 10 }, (_, i) => ({
				key: String(i),
				handler: (e: KeyboardEvent) => {
					if (isInputFocused()) {
						return
					}

					e.preventDefault()

					if (inputTimeoutRef.current) {
						clearTimeout(inputTimeoutRef.current)
					}

					currentInputRef.current += e.key

					const pageNumber = Number.parseInt(currentInputRef.current, 10)
					if (pageNumber >= 1 && pageNumber <= pages) {
						scrollToPage(pageNumber)
					}

					inputTimeoutRef.current = setTimeout(() => {
						currentInputRef.current = ""
					}, PAGE_INPUT_TIMEOUT_MS)
				},
				priority: 5,
			})),
		],
		[pages, scrollToPage, toggleFitMode, openMarkdownDialog]
	)

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

	useEffect(() => {
		return () => {
			if (inputTimeoutRef.current) {
				clearTimeout(inputTimeoutRef.current)
			}
			if (scrollTimeoutRef.current) {
				clearTimeout(scrollTimeoutRef.current)
			}
		}
	}, [])

	useEffect(() => {
		if (!rootRef.current || pages === 0) {
			return
		}
		const container = rootRef.current
		const elems = Array.from(container.querySelectorAll<HTMLElement>("[data-page]"))
		
		if (elems.length === 0) {
			return
		}
		
		const observer = new IntersectionObserver(
			entries => {
				if (isScrollingRef.current) {
					return
				}
				
				let maxRatio = 0
				let page: number | null = null
				for (const entry of entries) {
					if (entry.intersectionRatio > maxRatio) {
						maxRatio = entry.intersectionRatio
						const num = Number((entry.target as HTMLElement).dataset.page)
						page = Number.isFinite(num) ? num : null
					}
				}
				if (page !== null) {
					usePDFZustand.setState({ currentPage: page })
				}
			},
			{ root: container, threshold: Array.from({ length: INTERSECTION_STEPS + 1 }, (_, i) => i / INTERSECTION_STEPS) }
		)
		for (const el of elems) {
			observer.observe(el)
		}
		return () => {
			observer.disconnect()
		}
	}, [pages])

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
		<div>
			<div className="absolute inset-0 snap-y snap-mandatory overflow-x-hidden overflow-y-scroll bg-white dark:invert" ref={rootRef}>
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
						let fitWidth: number

						if (dims) {
							if (fitMode === "height") {
								fitWidth = Math.min(viewport.width, (viewport.height * dims.width) / dims.height)
							} else {
								fitWidth = viewport.width
							}
						} else {
							fitWidth = Math.min(viewport.width, viewport.height)
						}

						const pageHeight = dims ? (fitWidth * dims.height) / dims.width : viewport.height
						const containerHeight = fitMode === "width" ? Math.max(viewport.height, pageHeight) : viewport.height

						return (
							<div
								className="flex w-screen snap-start items-center justify-center overflow-hidden"
								data-page={pageNumber}
								key={`page-${pageNumber}`}
								style={{ height: `${containerHeight}px` }}
							>
								<Page
									onLoadSuccess={(page: PageLike) => {
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

			<ExportPagesDialog totalPages={pages} />
			<MarkdownDialog totalPages={pages} />
			<PageIndicator totalPages={pages} />

			{/* Fit Mode Indicator */}
			<div className="fixed bottom-4 left-4 z-50">
				<button
					className="group rounded-full bg-black/60 p-2 text-white backdrop-blur-sm transition-all duration-200 hover:scale-105 hover:bg-black/80"
					onClick={toggleFitMode}
					title={`Switch to ${fitMode === "height" ? "width" : "height"}-fit mode (F)`}
					type="button"
				>
					{fitMode === "height" ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
				</button>
			</div>

			{/* Markdown Conversion Button */}
			<div className="fixed right-4 bottom-4 z-50">
				<button
					className="group rounded-full bg-black/60 p-2 text-white backdrop-blur-sm transition-all duration-200 hover:scale-105 hover:bg-black/80"
					onClick={openMarkdownDialog}
					title="Convert to Markdown (M)"
					type="button"
				>
					<FileText className="h-4 w-4" />
				</button>
			</div>
		</div>
	)
}

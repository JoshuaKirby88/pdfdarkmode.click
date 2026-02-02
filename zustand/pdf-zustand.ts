import { createWithEqualityFn } from "zustand/traditional"

type PDFState = {
	pdf: string | File | null
	currentPage: number
	showExportDialog: boolean
	showMarkdownDialog: boolean
	markdownContent: string | null
	markdownCost: number | null
	isConvertingToMarkdown: boolean
	fitMode: "height" | "width"

	setShowExportDialog: (show: boolean) => void
	openExportDialog: () => void
	closeExportDialog: () => void
	toggleExportDialog: () => void
	setShowMarkdownDialog: (show: boolean) => void
	openMarkdownDialog: () => void
	closeMarkdownDialog: () => void
	setMarkdownContent: (content: string | null) => void
	setMarkdownCost: (cost: number | null) => void
	setIsConvertingToMarkdown: (loading: boolean) => void
	setFitMode: (mode: "height" | "width") => void
	toggleFitMode: () => void
}

export const usePDFZustand = createWithEqualityFn<PDFState>()((set, get) => ({
	pdf: null as string | File | null,
	currentPage: 0,
	showExportDialog: false,
	showMarkdownDialog: false,
	markdownContent: null,
	markdownCost: null,
	isConvertingToMarkdown: false,
	fitMode: "height" as "height" | "width",

	setShowExportDialog: (show: boolean) => set({ showExportDialog: show }),
	openExportDialog: () => set({ showExportDialog: true }),
	closeExportDialog: () => set({ showExportDialog: false }),
	toggleExportDialog: () => set({ showExportDialog: !get().showExportDialog }),
	setShowMarkdownDialog: (show: boolean) => set({ showMarkdownDialog: show }),
	openMarkdownDialog: () => set({ showMarkdownDialog: true }),
	closeMarkdownDialog: () => set({ showMarkdownDialog: false }),
	setMarkdownContent: (content: string | null) => set({ markdownContent: content }),
	setMarkdownCost: (cost: number | null) => set({ markdownCost: cost }),
	setIsConvertingToMarkdown: (loading: boolean) => set({ isConvertingToMarkdown: loading }),
	setFitMode: (mode: "height" | "width") => set({ fitMode: mode }),
	toggleFitMode: () => set({ fitMode: get().fitMode === "height" ? "width" : "height" }),
}))

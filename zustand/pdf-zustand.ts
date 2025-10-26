import { createWithEqualityFn } from "zustand/traditional"

type PDFState = {
	pdf: string | File | null
	currentPage: number
	showExportDialog: boolean
	fitMode: "height" | "width"

	setShowExportDialog: (show: boolean) => void
	openExportDialog: () => void
	closeExportDialog: () => void
	toggleExportDialog: () => void
	setFitMode: (mode: "height" | "width") => void
	toggleFitMode: () => void
}

export const usePDFZustand = createWithEqualityFn<PDFState>()((set, get) => ({
	pdf: null as string | File | null,
	currentPage: 0,
	showExportDialog: false,
	fitMode: "height" as "height" | "width",

	setShowExportDialog: (show: boolean) => set({ showExportDialog: show }),
	openExportDialog: () => set({ showExportDialog: true }),
	closeExportDialog: () => set({ showExportDialog: false }),
	toggleExportDialog: () => set({ showExportDialog: !get().showExportDialog }),
	setFitMode: (mode: "height" | "width") => set({ fitMode: mode }),
	toggleFitMode: () => set({ fitMode: get().fitMode === "height" ? "width" : "height" }),
}))

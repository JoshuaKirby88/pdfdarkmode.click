import { createWithEqualityFn } from "zustand/traditional"

type PDFState = {
	pdf: string | File | null
	currentPage: number | null
	showExportDialog: boolean

	setCurrentPage: (page: number | null) => void
	setShowExportDialog: (show: boolean) => void
	openExportDialog: () => void
	closeExportDialog: () => void
	toggleExportDialog: () => void
}

export const usePDFZustand = createWithEqualityFn<PDFState>()((set, get) => ({
	pdf: null as string | File | null,
	currentPage: null as number | null,
	showExportDialog: false,

	setCurrentPage: (page: number | null) => set({ currentPage: page }),
	setShowExportDialog: (show: boolean) => set({ showExportDialog: show }),
	openExportDialog: () => set({ showExportDialog: true }),
	closeExportDialog: () => set({ showExportDialog: false }),
	toggleExportDialog: () => set({ showExportDialog: !get().showExportDialog }),
}))
